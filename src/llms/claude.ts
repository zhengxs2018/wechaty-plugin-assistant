import { randomUUID } from 'node:crypto';

import { codeBlock } from 'common-tags';

import { type ChatModel, type ConversationContext } from '../core';
import { ChatGPTAPI, type ChatGPTAPIOptions } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatClaudeOptions extends ChatGPTAPIOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatClaude implements ChatModel {
  name = 'claude-api';

  human_name = 'Claude AI';

  api: ChatGPTAPI;

  limiter: PQueue;

  constructor(options: ChatClaudeOptions) {
    const {
      concurrency = 3,
      interval = 1000,
      // See https://github.com/UNICKCHENG/openai-proxy
      apiBaseUrl = 'https://openai.aihey.cc/claude',
      systemMessage = '',
      apiOrg,
      ...rest
    } = options;

    this.api = new ChatGPTAPI({
      ...rest,
      systemMessage,
      apiBaseUrl: `${apiBaseUrl}/${apiOrg}/v1`,
    });

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

    ctx.session.claude ??= {
      conversationId: randomUUID(),
    };

    const state = ctx.session.claude;

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
