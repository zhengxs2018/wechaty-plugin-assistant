import { randomUUID } from 'node:crypto';

import { codeBlock } from 'common-tags';

import { type ChatModel, type ConversationContext } from '../core';
import { ChatGPTAPI, ChatGPTAPIOptions } from '../llmapi';
import { PQueue } from '../vendors';

export interface ChatOpenAIOptions extends ChatGPTAPIOptions {
  concurrency?: number;
  interval?: number;
}

export class ChatOpenAI implements ChatModel {
  name = 'openai-api';

  human_name = 'ChatGPT';

  api: ChatGPTAPI;

  limiter: PQueue;

  constructor(options: ChatOpenAIOptions) {
    const {
      concurrency = 3,
      interval = 1000,
      // See https://github.com/UNICKCHENG/openai-proxy
      apiBaseUrl = 'https://openai.aihey.cc/openai/v1',
      ...rest
    } = options;

    this.api = new ChatGPTAPI({
      ...rest,
      apiBaseUrl,
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

    // 设置会话状态
    ctx.session.openai ??= {
      conversationId: randomUUID(),
    };

    const state = ctx.session.openai;
    const text = message.text();

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
