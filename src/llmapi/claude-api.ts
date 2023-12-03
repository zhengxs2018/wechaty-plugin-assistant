import { randomUUID } from 'node:crypto';

import { type ChatMessage } from './llm-api';

const CLAUDE_MODEL = 'claude-2';

export class APIError extends Error {
  statusCode?: number;
  statusText?: string;
}

export interface ClaudeAIOptions {
  /** @defaultValue `https://claude.ai/api` **/
  apiBaseUrl?: string;

  apiOrg: string;

  sessionKey: string;

  /** @defaultValue `claude-2` **/
  model?: ClaudeAI.Model;

  /** @defaultValue `Asia/Shanghai` **/
  timezone?: string;
}

export type ClaudeSendMessageOptions = {
  conversationId?: string;
  parentMessageId?: string;
  messageId?: string;
  abortSignal?: AbortSignal;
  attachments?: ClaudeAI.Attachment[];
  completionParams?: Partial<Omit<ClaudeAI.CompletionParams, 'prompt'>>;
};

export class ClaudeAI {
  protected _apiBaseUrl: string;
  protected _sessionKey: string;
  protected _apiOrg: string;

  protected _completionParams: Partial<
    Omit<ClaudeAI.CompletionParams, 'prompt'>
  >;

  constructor(opts: ClaudeAIOptions) {
    const {
      sessionKey,
      apiOrg,
      apiBaseUrl = 'https://claude.ai/api',
      model = CLAUDE_MODEL,
      timezone = 'Asia/Shanghai',
    } = opts;

    this._apiBaseUrl = apiBaseUrl;
    this._sessionKey = sessionKey;
    this._apiOrg = apiOrg;

    this._completionParams = { model, timezone };

    if (!this._sessionKey) {
      throw new Error('ClaudeAI missing required sessionKey');
    }

    if (!this._apiOrg) {
      throw new Error('ClaudeAI missing required apiOrg');
    }
  }

  async sendMessage(text: string, options?: ClaudeSendMessageOptions) {
    const {
      messageId = randomUUID(),
      parentMessageId,
      attachments = [],
      completionParams,
      abortSignal,
    } = options || {};

    const { conversationId } = await this.upsertChatConversations(options);

    const userMessage: ChatMessage = {
      role: 'user',
      id: messageId,
      conversationId,
      parentMessageId,
      text,
      type: 'text',
      files: [],
    };

    const answer = await this.request('/append_message', {
      body: JSON.stringify({
        organization_uuid: this._apiOrg,
        conversation_uuid: conversationId,
        text,
        attachments,
        completion: {
          ...this._completionParams,
          ...completionParams,
          prompt: text,
        },
      }),
      signal: abortSignal,
    }).then(res => res.text());

    const result: ChatMessage = {
      role: 'assistant',
      id: randomUUID(),
      conversationId,
      parentMessageId: userMessage.id,
      text: answer,
      type: 'text',
      files: [],
    };

    return result;
  }

  protected async upsertChatConversations(
    options?: ClaudeSendMessageOptions,
  ): Promise<{ conversationId: string }> {
    const { conversationId } = options ?? {};
    if (conversationId) return { conversationId };

    const { uuid } = await this.createChatConversations();

    return { conversationId: uuid };
  }

  protected createChatConversations(): Promise<{
    uuid: string;
    name: string;
    summary: string;
    created_at: string;
    updated_at: string;
  }> {
    return this.request(`/organizations/${this._apiOrg}/chat_conversations`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'chat',
      }),
    }).then(response => response.json());
  }

  async request(path: string, init: RequestInit): Promise<Response> {
    const response = await fetch(`${this._apiBaseUrl}${path}`, {
      method: 'POST',
      ...init,
      headers: {
        ...this.defaultHeaders(),
        ...init.headers,
      },
    });

    if (!response.ok) {
      let reason: string;

      try {
        reason = await response.text();
      } catch (err) {
        reason = response.statusText;
      }

      const msg = `Claude error ${response.status}: ${reason}`;
      const error = new APIError(msg, { cause: response });
      error.statusCode = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    return response;
  }

  protected defaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent(),
      ...this.authHeaders(),
    };
  }

  protected authHeaders(): Record<string, string> {
    return {
      Cookie: `sessionKey=${this._sessionKey};`,
    };
  }

  protected userAgent() {
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
  }
}

export namespace ClaudeAI {
  export type Model = (string & NonNullable<unknown>) | 'claude-2';

  export type Attachment = {
    file_name?: string;
    file_size?: number;
    file_type?: string;
    extracted_content: string;
    totalPages?: number;
  };

  export type CompletionParams = {
    model: Model;
    timezone?: string;
    prompt: string;
  };

  export type ChatCompletionCreateParams = {
    conversation_uuid: string;
    organization_uuid: string;
    completion: CompletionParams;
    attachments?: Attachment[];
  };
}
