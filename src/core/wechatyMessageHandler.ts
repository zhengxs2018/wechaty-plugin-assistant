import { codeBlock } from 'common-tags';
import { log, type Message } from 'wechaty';

import { castToError } from '../util';
import { type Assistant } from './createAssistant';
import { createConversationContext } from './createConversationContext';
import { processTextMessage } from './processTextMessage';
import { processUnknownMessage } from './processUnknownMessage';

export async function wechatyMessageHandler(
  assistant: Assistant,
  message: Message,
): Promise<void> {
  const { monitor } = assistant;

  // 允许中间停止助手
  if (!monitor.running) return;

  // Note: 忽略每次启动之前的微信同步消息，避免重复处理
  if (monitor.startupTime > message.date()) return;

  // Note: 有时候不会收到，遂放弃实现自我管理的功能
  if (message.self()) return;

  // 如果是群消息，但是没有提到自己，则忽略
  if (message.room() && !(await message.mentionSelf())) {
    return;
  }

  monitor.stats.message += 1;

  const ctx = await createConversationContext(assistant, message);

  try {
    const {
      wechaty: { Message },
    } = message;

    switch (message.type()) {
      case Message.Type.Text:
        await processTextMessage(assistant, ctx);
        break;
      default:
        await processUnknownMessage(assistant, ctx);
    }

    monitor.stats.success += 1;
  } catch (err) {
    if (ctx.aborted) return;

    monitor.stats.failure += 1;

    const error = castToError(err);

    assistant.options.notifications?.messageProcessFailed(
      error,
      message,
      assistant,
    );

    log.error(error.message);

    ctx.reply(codeBlock`
    ⊶ 系统提示
    ﹊
    系统错误，请稍后再试！`);
  } finally {
    ctx.dispose();
  }
}
