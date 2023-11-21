import Keyv from 'keyv';

export type Role = 'user' | 'assistant' | 'system';

export type FetchFn = typeof fetch;

export type ChatGPTAPIOptions = {
  apiKey: string;

  /** @defaultValue `'https://api.openai.com'` **/
  apiBaseUrl?: string;

  apiOrg?: string;

  /** @defaultValue `false` **/
  debug?: boolean;

  completionParams?: Partial<
    Omit<openai.CreateChatCompletionRequest, 'messages' | 'n' | 'stream'>
  >;

  systemMessage?: string;

  /** @defaultValue `4096` **/
  maxModelTokens?: number;

  /** @defaultValue `1000` **/
  maxResponseTokens?: number;

  messageStore?: Keyv;
  getMessageById?: GetMessageByIdFunction;
  upsertMessage?: UpsertMessageFunction;

  fetch?: FetchFn;
};

export type SendMessageOptions = {
  /** The name of a user in a multi-user chat. */
  name?: string;
  parentMessageId?: string;
  conversationId?: string;
  messageId?: string;
  stream?: boolean;
  systemMessage?: string;
  timeoutMs?: number;
  onProgress?: (partialResponse: ChatMessage) => void;
  abortSignal?: AbortSignal;
  completionParams?: Partial<
    Omit<openai.CreateChatCompletionRequest, 'messages' | 'n' | 'stream'>
  >;
};

export type MessageActionType = 'next' | 'variant';

export type SendMessageBrowserOptions = {
  conversationId?: string;
  parentMessageId?: string;
  messageId?: string;
  action?: MessageActionType;
  timeoutMs?: number;
  onProgress?: (partialResponse: ChatMessage) => void;
  abortSignal?: AbortSignal;
};

export interface ChatMessage {
  id: string;
  text: string;
  role: Role;
  name?: string;
  delta?: string;
  detail?:
    | openai.CreateChatCompletionResponse
    | CreateChatCompletionStreamResponse;

  // relevant for both ChatGPTAPI and ChatGPTUnofficialProxyAPI
  parentMessageId?: string;

  // only relevant for ChatGPTUnofficialProxyAPI (optional for ChatGPTAPI)
  conversationId?: string;
}

export class ChatGPTError extends Error {
  statusCode?: number;
  statusText?: string;
  isFinal?: boolean;
  accountId?: string;
}

/** Returns a chat message from a store by it's ID (or null if not found). */
export type GetMessageByIdFunction = (id: string) => Promise<ChatMessage>;

/** Upserts a chat message to a store. */
export type UpsertMessageFunction = (message: ChatMessage) => Promise<void>;

export interface CreateChatCompletionStreamResponse
  extends openai.CreateChatCompletionDeltaResponse {
  usage: CreateCompletionStreamResponseUsage;
}

export interface CreateCompletionStreamResponseUsage
  extends openai.CreateCompletionResponseUsage {
  estimated: true;
}

/**
 * https://chat.openapi.com/backend-api/conversation
 */
export type ConversationJSONBody = {
  /**
   * The action to take
   */
  action: string;

  /**
   * The ID of the conversation
   */
  conversation_id?: string;

  /**
   * Prompts to provide
   */
  messages: Prompt[];

  /**
   * The model to use
   */
  model: string;

  /**
   * The parent message ID
   */
  parent_message_id: string;
};

export type Prompt = {
  /**
   * The content of the prompt
   */
  content: PromptContent;

  /**
   * The ID of the prompt
   */
  id: string;

  /**
   * The role played in the prompt
   */
  role: Role;
};

export type ContentType = 'text';

export type PromptContent = {
  /**
   * The content type of the prompt
   */
  content_type: ContentType;

  /**
   * The parts to the prompt
   */
  parts: string[];
};

export type ConversationResponseEvent = {
  message?: Message;
  conversation_id?: string;
  error?: string | null;
};

export type Message = {
  id: string;
  content: MessageContent;
  role: Role;
  user: string | null;
  create_time: string | null;
  update_time: string | null;
  end_turn: null;
  weight: number;
  recipient: string;
  metadata: MessageMetadata;
};

export type MessageContent = {
  content_type: string;
  parts: string[];
};

export type MessageMetadata = any;

export namespace openai {
  export interface CreateChatCompletionDeltaResponse {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: [
      {
        delta: {
          role: Role;
          content?: string;
        };
        index: number;
        finish_reason: string | null;
      },
    ];
  }

  export interface ChatCompletionRequestMessage {
    role: ChatCompletionRequestMessageRoleEnum;
    content: string;
    name?: string;
  }
  export declare const ChatCompletionRequestMessageRoleEnum: {
    readonly System: 'system';
    readonly User: 'user';
    readonly Assistant: 'assistant';
  };
  export declare type ChatCompletionRequestMessageRoleEnum =
    (typeof ChatCompletionRequestMessageRoleEnum)[keyof typeof ChatCompletionRequestMessageRoleEnum];
  export interface ChatCompletionResponseMessage {
    role: ChatCompletionResponseMessageRoleEnum;
    content: string;
  }
  export declare const ChatCompletionResponseMessageRoleEnum: {
    readonly System: 'system';
    readonly User: 'user';
    readonly Assistant: 'assistant';
  };
  export declare type ChatCompletionResponseMessageRoleEnum =
    (typeof ChatCompletionResponseMessageRoleEnum)[keyof typeof ChatCompletionResponseMessageRoleEnum];

  export interface CreateChatCompletionRequest {
    model: string;
    messages: Array<ChatCompletionRequestMessage>;
    temperature?: number | null;
    top_p?: number | null;
    n?: number | null;
    stream?: boolean | null;
    stop?: CreateChatCompletionRequestStop;
    max_tokens?: number;
    presence_penalty?: number | null;
    frequency_penalty?: number | null;
    logit_bias?: object | null;
    user?: string;
  }

  export declare type CreateChatCompletionRequestStop = Array<string> | string;
  export interface CreateChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<CreateChatCompletionResponseChoicesInner>;
    usage?: CreateCompletionResponseUsage;
  }

  export interface CreateChatCompletionResponseChoicesInner {
    index?: number;
    message?: ChatCompletionResponseMessage;
    finish_reason?: string;
  }
  export interface CreateCompletionResponseUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
