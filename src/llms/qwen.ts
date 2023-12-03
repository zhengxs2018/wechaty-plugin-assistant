import { codeBlock } from 'common-tags';

import {
  type ChatModel,
  ChatType,
  type ConversationContext,
} from '../interfaces';
import { QWenAPI, type QWenAPIOptions } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatQWenOptions extends QWenAPIOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatQWen implements ChatModel {
  name: string = 'qwen-api';

  human_name: string = '通义千问';

  input_type = [ChatType.Text];

  protected api: QWenAPI;
  protected limiter: PQueue;

  constructor(options: ChatQWenOptions = {}) {
    const { concurrency = 3, interval = 1000, ...rest } = options;

    this.api = new QWenAPI(rest);

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
