import { codeBlock } from 'common-tags';
import { log, type Message } from 'wechaty';

import { type Assistant } from '../interfaces';
import { castToError } from '../util';
import { createConversationContext } from './createConversationContext';
import { processFileMessage } from './processFileMessage';
import { processTextMessage } from './processTextMessage';
import { processUnknownMessage } from './processUnknownMessage';

export async function wechatyMessageHandler(
  assistant: Assistant,
  message: Message,
): Promise<void> {
  const { monitor,options: { disabledOutdatedDetection } } = assistant;

  // 允许中间停止助手
  if (!monitor.running) return;

  // Note: 忽略每次启动之前的微信同步消息，避免重复处理
  if (!disabledOutdatedDetection && monitor.startupTime > message.date()) return;

  // Note: 有时候不会收到，遂放弃实现自我管理的功能
  if (message.self()) return;

  const {
    wechaty: { Message, Contact },
  } = message;

  // Note: 忽略非个人消息，如微信团队发送的消息
  if (message.talker().type() !== Contact.Type.Individual) return;

  // 提供给钩子的中断控制器
  const controller = new AbortController();

  // Note: 黑名单拦截功能需要使用
  await assistant.hooks.onMessage.process(controller, assistant, message);

  if (controller.signal.aborted) return;

  // 如果是群消息，但是没有提到自己，则忽略
  if (message.room()) {
    await assistant.hooks.onRoomMessage.process(controller, assistant, message);

    if (controller.signal.aborted) return;

    if (!(await message.mentionSelf())) return;

    await assistant.hooks.onRoomMentionSelfMessage.process(
      controller,
      assistant,
      message,
    );

    if (controller.signal.aborted) return;
  } else {
    await assistant.hooks.onIndividualMessage.process(
      controller,
      assistant,
      message,
    );

    if (controller.signal.aborted) return;
  }

  monitor.stats.message += 1;

  const ctx = await createConversationContext(controller, assistant, message);

  if (controller.signal.aborted) return;

  try {
    switch (message.type()) {
      case Message.Type.Attachment:
      case Message.Type.Audio:
      case Message.Type.Image:
      case Message.Type.Video:
        await processFileMessage(controller, assistant, ctx);
        break;
      case Message.Type.Text:
        await processTextMessage(controller, assistant, ctx);
        break;
      default:
        await processUnknownMessage(assistant, ctx);
    }

    monitor.stats.success += 1;
  } catch (err) {
    if (controller.signal.aborted || ctx.aborted) return;

    monitor.stats.failure += 1;

    const error = castToError(err);

    log.error(error.message);

    ctx.reply(codeBlock`
    ⊶ 系统提示
    ﹊
    系统错误，请稍后再试！`);
  } finally {
    ctx.dispose();
  }
}
