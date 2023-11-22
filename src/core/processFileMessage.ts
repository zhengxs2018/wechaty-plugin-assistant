import { codeBlock } from 'common-tags';

import { type Assistant, type ConversationContext } from '../interfaces';

export async function processFileMessage(
  controller: AbortController,
  assistant: Assistant,
  ctx: ConversationContext,
) {
  // Note: 为畅聊模式做准备
  await assistant.hooks.onPrepareFileMessage.process(
    controller,
    ctx,
    assistant,
  );

  if (controller.signal.aborted) return;

  // 防止重复提问
  if (ctx.isLocked) {
    return ctx.reply(codeBlock`
    ⊶ 系统提示
    ﹊
    稍等一下，还在思考中...`);
  }

  // 锁定对话
  ctx.createLock();

  try {
    await assistant.call(ctx);
  } finally {
    ctx.releaseLock();
  }
}
