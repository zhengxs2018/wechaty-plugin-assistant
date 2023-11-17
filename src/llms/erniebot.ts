import { codeBlock } from 'common-tags';

import { type ChatModel, ChatType, type ConversationContext } from '../core';
import { type EBApiOptions, ERNIEBotAPI } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatERNIEBotOptions extends EBApiOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatERNIEBot implements ChatModel {
  name: string;
  human_name: string;
  input_type = [ChatType.Text];

  protected api: ERNIEBotAPI;
  protected limiter: PQueue;

  constructor(options: ChatERNIEBotOptions) {
    const { token, concurrency = 3, interval = 1000, ...rest } = options;

    if (token) {
      this.name = 'qianfan';
      this.human_name = '文心千帆';
    } else {
      this.name = 'aistudio';
      this.human_name = '文心飞浆';
    }

    this.api = new ERNIEBotAPI({ token, ...rest });

    this.limiter = new PQueue({
      concurrency,
      interval,
    });
  }

  async call(ctx: ConversationContext) {
    const { message, session } = ctx;
    const state = (session[this.name] ??= {});

    const chat = await this.limiter.add(
      ({ signal }) => {
        return this.api.sendMessage(message.text(), {
          parentMessageId: state.parentMessageId,
          abortSignal: signal,
        });
      },
      {
        signal: ctx.signal,
        throwOnTimeout: true,
      },
    );

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
