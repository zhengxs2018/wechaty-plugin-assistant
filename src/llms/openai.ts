import { codeBlock } from 'common-tags';

import {
  type ChatModel,
  ChatType,
  type ConversationContext,
} from '../interfaces';
import { ChatGPTAPI, ChatGPTAPIOptions } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatOpenAIOptions extends ChatGPTAPIOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatOpenAI implements ChatModel {
  name = 'openai-api';
  human_name = 'ChatGPT';
  input_type = [ChatType.Text];

  protected api: ChatGPTAPI;
  protected limiter: PQueue;

  constructor(options: ChatOpenAIOptions) {
    const {
      concurrency = 3,
      interval = 1000,
      // See https://github.com/UNICKCHENG/openai-proxy
      baseURL = 'https://openai.aihey.cc/openai/v1',
      ...rest
    } = options;

    this.api = new ChatGPTAPI({
      ...rest,
      baseURL,
    });

    this.limiter = new PQueue({
      concurrency,
      interval,
    });
  }

  async call(ctx: ConversationContext) {
    const { message, session } = ctx;
    const state = (session.openai ??= {});

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
