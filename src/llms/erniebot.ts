import { codeBlock } from 'common-tags';

import {
  type ChatModel,
  ChatType,
  type ConversationContext,
} from '../interfaces';
import { type EBApiOptions, ERNIEBotAPI } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatERNIEBotOptions extends EBApiOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatERNIEBot implements ChatModel {
  name: string ='ernie-bot'
  human_name: string = '文心一言';
  input_type = [ChatType.Text];

  protected api: ERNIEBotAPI;
  protected limiter: PQueue;

  constructor(options: ChatERNIEBotOptions) {
    const { concurrency = 3, interval = 1000, ...rest } = options;

    this.api = new ERNIEBotAPI(rest);

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
