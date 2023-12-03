import { randomUUID } from 'node:crypto';

import { getEncoding, type Tiktoken, type TiktokenEncoding } from 'js-tiktoken';
import Keyv from 'keyv';
import OpenAI from 'openai';

import { QuickLRU } from '../vendors';

export interface ChatLLMAPIOptions<ChatParams = Record<string, any>> {
  debug?: boolean;
  chatParams?: ChatParams;
  maxModelTokens?: number;
  maxResponseTokens?: number;
  messageStore?: Keyv;
  systemMessage?: string;
  userLabel?: string;
  assistantLabel?: string;
  encoding?: TiktokenEncoding;
  getMessageById?: GetMessageByIdFunction;
  upsertMessage?: UpsertMessageFunction;
}

export abstract class ChatLLMAPI<ChatParams = Record<string, any>> {
  protected debug: boolean;

  protected systemMessage?: string;
  protected chatParams: ChatParams;
  protected maxModelTokens: number;
  protected maxResponseTokens: number;

  protected userLabel: string;
  protected assistantLabel: string;

  protected getMessageById: GetMessageByIdFunction;
  protected upsertMessage: UpsertMessageFunction;
  protected messageStore: Keyv;

  protected tokenizer: Tiktoken;

  constructor(options: ChatLLMAPIOptions<ChatParams>) {
    const {
      debug = false,
      systemMessage,
      chatParams,
      maxModelTokens = 4000,
      maxResponseTokens = 1000,
      userLabel = 'User',
      assistantLabel = 'Assistant',
      messageStore,
      encoding = 'cl100k_base',
      getMessageById,
      upsertMessage,
    } = options;

    this.debug = debug;

    this.systemMessage = systemMessage;
    this.chatParams = chatParams || ({} as ChatParams);

    this.userLabel = userLabel;
    this.assistantLabel = assistantLabel;

    this.maxModelTokens = maxModelTokens;
    this.maxResponseTokens = maxResponseTokens;

    this.tokenizer = getEncoding(encoding);

    this.getMessageById = getMessageById ?? this.defaultGetMessageById;
    this.upsertMessage = upsertMessage ?? this.defaultUpsertMessage;

    if (messageStore) {
      this.messageStore = messageStore;
    } else {
      this.messageStore = new Keyv({
        store: new QuickLRU({ maxSize: 10000 }),
      });
    }
  }

  async sendMessage(
    text: string,
    options: SendMessageOptions<ChatParams> = {},
  ) {
    const {
      sessionId,
      conversationId,
      parentMessageId,
      messageId = randomUUID(),
      ...rest
    } = options;

    const question: ChatMessage = {
      sessionId,
      conversationId,
      id: messageId,
      parentMessageId,
      role: 'user',
      type: 'text',
      text,
      files: [],
    };

    const answer: ChatMessage = {
      sessionId,
      conversationId,
      id: randomUUID(),
      parentMessageId: question.id,
      role: 'assistant',
      type: 'text',
      text: '',
      files: [],
    };

    const responseP = this.makeRequest(question, answer, {
      sessionId,
      conversationId,
      parentMessageId,
      messageId,
      ...rest,
    })

    return responseP.then(async () => {
      if (answer.needClearHistory || answer.error) {
        return answer;
      }

      return Promise.all([
        this.upsertMessage(question),
        this.upsertMessage(answer),
      ]).then(() => answer);
    });
  }

  protected abstract makeRequest(
    question: ChatMessage,
    answer: ChatMessage,
    options: SendMessageOptions<ChatParams>,
  ): Promise<void>;

  protected async buildMessages(
    text: string,
    {
      parentMessageId,
      systemMessage = this.systemMessage,
    }: SendMessageOptions<ChatParams>,
  ) {
    const userLabel = this.userLabel;
    const assistantLabel = this.assistantLabel;

    const maxNumTokens = this.maxModelTokens - this.maxResponseTokens;
    let messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage,
      });
    }

    const systemMessageOffset = messages.length;
    let nextMessages = text
      ? messages.concat([
          {
            role: 'user',
            content: text,
          },
        ])
      : messages;
    let numTokens = 0;

    do {
      const prompt = nextMessages
        .reduce((prompt, message) => {
          switch (message.role) {
            case 'system':
              return prompt.concat([`Instructions:\n${message.content}`]);
            case 'user':
              return prompt.concat([`${userLabel}:\n${message.content}`]);
            default:
              return prompt.concat([`${assistantLabel}:\n${message.content}`]);
          }
        }, [] as string[])
        .join('\n\n');

      const nextNumTokensEstimate = await this.getTokenCount(prompt);
      const isValidPrompt = nextNumTokensEstimate <= maxNumTokens;

      if (prompt && !isValidPrompt) {
        break;
      }

      messages = nextMessages;
      numTokens = nextNumTokensEstimate;

      if (!isValidPrompt) {
        break;
      }

      if (!parentMessageId) {
        break;
      }

      const parentMessage = await this.getMessageById(parentMessageId);
      if (!parentMessage) {
        break;
      }

      const parentMessageRole = parentMessage.role || 'user';

      nextMessages = nextMessages.slice(0, systemMessageOffset).concat([
        {
          role: parentMessageRole,
          content: parentMessage.text,
        },
        ...nextMessages.slice(systemMessageOffset),
      ]);

      parentMessageId = parentMessage.parentMessageId;
    } while (true);

    // Use up to 4096 tokens (prompt + response), but try to leave 1000 tokens
    // for the response.
    const maxTokens = Math.max(
      1,
      Math.min(this.maxModelTokens - numTokens, this.maxResponseTokens),
    );

    return { messages, maxTokens, numTokens };
  }

  protected async getTokenCount(text: string) {
    // TODO: use a better fix in the tokenizer
    text = text.replace(/<\|endoftext\|>/g, '');

    return this.tokenizer.encode(text).length;
  }

  protected async defaultGetMessageById(id: string) {
    const res = await this.messageStore.get(id);
    return res;
  }

  protected async defaultUpsertMessage(message: any) {
    await this.messageStore.set(message.id, message);
  }
}

export type GetMessageByIdFunction = (id: string) => Promise<any>;

export type UpsertMessageFunction = (message: ChatMessage) => Promise<void>;

export interface MessageStoreOptions {
  messageStore?: Keyv;
  getMessageById?: GetMessageByIdFunction;
  upsertMessage?: UpsertMessageFunction;
}

export type Role = 'system' | 'user' | 'assistant';

export type ChatCompletionRequestMessage = {
  role: Role;
  content: string;
  name?: string;
};

export interface ChatMessage {
  sessionId?: number | string;
  conversationId?: string | number;
  parentMessageId?: string;
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  text: string;
  files: string[];
  role: Role;
  name?: string;
  needClearHistory?: boolean;
  error?: boolean;
}

export interface SendMessageOptions<CompletionParams = Record<string, any>> {
  /**
   * 会话 ID
   */
  sessionId?: number | string;
  /**
   * 对话 ID
   */
  conversationId?: string | number;
  /**
   * 上一条消息 ID
   */
  parentMessageId?: string;
  /**
   * 当前消息 ID
   */
  messageId?: string;
  /**
   * 系统消息
   */
  systemMessage?: string;
  /**
   * 其他对话参数
   */
  chatParams?: CompletionParams;
  /**
   * 中断信号
   */
  abortSignal?: any;
  /**
   * TODO 预留参数
   */
  onProcess?: () => void;
  /**
   * TODO 预留参数
   */
  stream?: boolean;
}
