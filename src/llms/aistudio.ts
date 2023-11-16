import { codeBlock } from 'common-tags';

import { type ChatModel, type ConversationContext } from '../core';
import { AIStudioAPI, AIStudioAPIOptions } from '../llmapi/aistudio';
import { PQueue } from '../vendors';

export class ChatAIStudio implements ChatModel {
  name = 'chat-aistudio';

  human_name = '飞浆 AI';

  api: AIStudioAPI;

  limiter: PQueue;

  constructor(options: AIStudioAPIOptions) {
    const { concurrency = 3, interval = 1000, ...rest } = options;

    this.api = new AIStudioAPI(rest);

    this.limiter = new PQueue({
      concurrency,
      interval,
    });
  }

  async call(ctx: ConversationContext) {
    const { message } = ctx;
    const {
      wechaty: { Message },
    } = message;

    if (message.type() !== Message.Type.Text) {
      return ctx.reply(
        codeBlock`
        ⊶ 系统提示
        ﹊
        ${this.human_name} 暂不支持此类型的消息`,
        true,
      );
    }

    const { api, limiter } = this;

    const text = message.text();
    const state = ctx.session?.chatgpt ?? {};

    const chat: any = await limiter.add(
      ({ signal }) => {
        return api.sendMessage(text, {
          conversationId: state.conversationId,
          parentMessageId: state.parentMessageId,
          abortSignal: signal,
        });
      },
      {
        signal: ctx.lock?.controller.signal,
        throwOnTimeout: true,
      },
    );

    state.conversationId = chat.conversationId;
    state.parentMessageId = chat.parentMessageId;

    ctx.reply(
      codeBlock`
      ${chat.text}
      -------------------
      以上内容来自 ${this.human_name}，与开发者无关`,
      true,
    );
  }
}
