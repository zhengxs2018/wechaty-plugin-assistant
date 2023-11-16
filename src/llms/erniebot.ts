import { codeBlock } from 'common-tags';
import { randomUUID } from 'crypto';

import { type ChatModel, type ConversationContext } from '../core';
import { type EBApiOptions, ERNIEBotAPI } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatERNIEBotOptions extends EBApiOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatERNIEBot implements ChatModel {
  name = 'erniebot';

  human_name = '文心一言';

  api: ERNIEBotAPI;

  limiter: PQueue;

  constructor(options: ChatERNIEBotOptions) {
    const { concurrency = 3, interval = 1000, ...rest } = options;

    this.api = new ERNIEBotAPI(rest);

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

    ctx.session.ernie_bot ??= {
      conversationId: randomUUID(),
    };

    const state = ctx.session.erniebot;

    const chat = await limiter.add(
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
    state.parentMessageId = chat.id;

    ctx.reply(
      codeBlock`
      ${chat.text}
      -------------------
      以上内容来自 ${this.human_name}，与开发者无关`,
      true,
    );
  }
}
