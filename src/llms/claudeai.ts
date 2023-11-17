import { codeBlock } from 'common-tags';

import { type ChatModel, ChatType, type ConversationContext } from '../core';
import { ClaudeAI, type ClaudeAIOptions } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatClaudeAIOptions extends ClaudeAIOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatClaudeAI implements ChatModel {
  name = 'claude-web-api';
  human_name = 'Claude AI';
  input_type = [ChatType.Text];

  protected api: ClaudeAI;
  protected limiter: PQueue;

  constructor(options: ChatClaudeAIOptions) {
    const {
      concurrency = 3,
      interval = 1000,
      apiBaseUrl = 'https://openai.aihey.cc/claude',
      ...rest
    } = options;

    this.api = new ClaudeAI({
      ...rest,
      apiBaseUrl,
    });

    this.limiter = new PQueue({
      concurrency,
      interval,
    });
  }

  async call(ctx: ConversationContext) {
    const { message, session } = ctx;
    const { api, limiter } = this;

    const text = message.text();
    const state = (session.claude ??= {});

    const chat = await limiter.add(
      ({ signal }) => {
        return api.sendMessage(text, {
          parentMessageId: state.parentMessageId,
          abortSignal: signal,
        });
      },
      {
        signal: ctx.signal,
        throwOnTimeout: true,
      },
    );

    // 记录上下文
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
