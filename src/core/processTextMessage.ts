import { codeBlock } from 'common-tags';

import { type Assistant, type ConversationContext } from '../interfaces';
import { toSingleQuotes } from '../vendors';

const REF_MSG_SEP = '- - - - - - - - - - - - - - -';

/**
 * 清理用户消息
 *
 * @param content - 用户消息
 * @returns 清理后的消息
 */
function cleanUserMessage(content: string): string {
  return toSingleQuotes(content).replace(/\n+/gm, '  ').trim();
}

export async function processTextMessage(
  controller: AbortController,
  assistant: Assistant,
  ctx: ConversationContext,
) {
  const { message, reply } = ctx;

  // 拒绝空内容
  let text = message.text().trim();
  if (!text) {
    controller.abort();

    return reply(codeBlock`
      ⊶ 系统提示
      ﹊
      👀 你想要说什么？`);
  }

  const { monitor, keywords } = assistant;

  // Note: 需要先清理，否则命令无法匹配
  // 如果是群聊，清除自身的 @ 信息
  if (ctx.conversationTitle) {
    message.payload!.text = text = text
      // 清理 @机器人 的信息
      .replaceAll(`@${ctx.chatbotUserName}`, '')
      // 去除 @ 符合，但保留 @ 后的内容
      .replaceAll(/@(\S*)/gmu, '$1')
      .trim();
  }

  // Note: 如果以斜线开头当作指令处理
  // 并且指令允许重复触发
  if (text.startsWith('/')) {
    monitor.stats.command += 1;
    return assistant.command.parse(ctx, text.split(' '))
  }

  // 处理帮助命令
  if (keywords.help.includes(text)) {
    controller.abort();
    return assistant.options.help(ctx)
  }

  if (keywords.stopConversation.includes(text)) {
    if (ctx.isLocked) {
      monitor.stats.skipped += 1;
      ctx.abort();
    }

    return reply(codeBlock`
      ⊶ 系统提示
      ﹊
      好的，我将不再回复。如果你有其他问题或需要帮助，请随时告诉我，我将竭诚为您服务。`);
  }

  // 允许用户主动终止对话
  if (keywords.newConversation.includes(text)) {
    ctx.session.clear();

    if (ctx.isLocked) {
      ctx.abort();

      monitor.stats.skipped += 1;
    }

    return reply(codeBlock`
      ⊶ 系统提示
      ﹊
      好的，新的对话从现在开始，期待与您的交流。

      如有任何问题或需要帮助，请随时提出.`);
  }

  // Note: 可以解决提升多模型切换命令的优先级
  await assistant.hooks.onPrepareTextMessage.process(
    controller,
    ctx,
    assistant,
  );

  if (controller.signal.aborted) return;

  // 防止重复提问
  if (ctx.isLocked) {
    return reply(codeBlock`
    ⊶ 系统提示
    ﹊
    稍等一下，还在思考中...`);
  }

  // 锁定对话
  ctx.createLock();

  // 处理消息引用
  if (text.includes(REF_MSG_SEP)) {
    const [reference, input] = text.split(REF_MSG_SEP);

    // 提取引用内容
    const question = reference
      .split('：')
      .slice(1)
      .join('')
      .trim()
      .replace(/」$/, '');

    // 覆盖原始消息
    message.payload!.text = codeBlock`
      我会发送一个被引用消息和一个问题;
      你需要根据我引用的消息，来回答我发送的问题;
      你应该仅返回和我引用消息和问题相关的内容;
      被引用的消息: """ ${cleanUserMessage(question)}; """;
      这是我的问题: """ ${cleanUserMessage(input)}; """ `;
  }

  try {
    await assistant.call(ctx);
  } finally {
    ctx.releaseLock();
  }
}
