import { codeBlock } from 'common-tags';

import {
  type ChatModel,
  ChatType,
  type ConversationContext,
} from '../interfaces';
import { HunYuanAPI, type HunYuanAPIOptions } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatHunYuanOptions extends HunYuanAPIOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatHunYuan implements ChatModel {
  name: string = 'hunyuan-api';

  human_name: string = '混元助手';

  input_type = [ChatType.Text];

  protected api: HunYuanAPI;
  protected limiter: PQueue;

  constructor(options: ChatHunYuanOptions = {}) {
    const { concurrency = 3, interval = 1000, ...rest } = options;

    this.api = new HunYuanAPI(rest);

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
