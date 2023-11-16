import { randomUUID } from 'node:crypto';

import ERNIEBotSDK, { type EBOptions } from '@zhengxs/erniebot';
import Keyv from 'keyv';

import { QuickLRU } from '../vendors';
import {
  type ChatMessage,
  type GetMessageByIdFunction,
  type UpsertMessageFunction,
} from './chatgpt-api';
import * as tokenizer from './chatgpt-api/tokenizer';

const CHATGPT_MODEL = 'ernie-bot';

const USER_LABEL_DEFAULT = 'User';
const ASSISTANT_LABEL_DEFAULT = 'ASSISTANT';

export type EBSendMessageOptions = {
  parentMessageId?: string;
  conversationId?: string;
  messageId?: string;
  stream?: boolean;
  abortSignal?: AbortSignal;
  completionParams?: Record<string, any>;
};

export interface EBApiOptions extends EBOptions {
  /** @defaultValue `4096` **/
  maxModelTokens?: number;

  /** @defaultValue `1000` **/
  maxResponseTokens?: number;

  messageStore?: Keyv;
  getMessageById?: GetMessageByIdFunction;
  upsertMessage?: UpsertMessageFunction;
}

type SendMessageOptions = {
  conversationId?: string;
  parentMessageId?: string;
  messageId?: string;
  abortSignal?: AbortSignal;
  stream?: boolean;
};

export class ERNIEBotAPI {
  protected _maxModelTokens: number;
  protected _maxResponseTokens: number;

  protected _getMessageById: GetMessageByIdFunction;
  protected _upsertMessage: UpsertMessageFunction;

  protected _messageStore: Keyv<ChatMessage>;

  api: ERNIEBotSDK;

  constructor(opts: EBApiOptions) {
    const {
      maxModelTokens = 4000,
      maxResponseTokens = 1000,
      messageStore,
      getMessageById,
      upsertMessage,
      model = CHATGPT_MODEL,
      ...rest
    } = opts;

    this.api = new ERNIEBotSDK({
      ...rest,
      model,
    });

    this._maxModelTokens = maxModelTokens;
    this._maxResponseTokens = maxResponseTokens;

    this._getMessageById = getMessageById ?? this._defaultGetMessageById;
    this._upsertMessage = upsertMessage ?? this._defaultUpsertMessage;

    if (messageStore) {
      this._messageStore = messageStore;
    } else {
      this._messageStore = new Keyv<ChatMessage, any>({
        store: new QuickLRU<string, ChatMessage>({ maxSize: 10000 }),
      });
    }
  }

  /**
   * Sends a message to the OpenAI chat completions endpoint, waits for the response
   * to resolve, and returns the response.
   *
   * If you want your response to have historical context, you must provide a valid `parentMessageId`.
   *
   * If you want to receive a stream of partial responses, use `opts.onProgress`.
   *
   * Set `debug: true` in the `ChatGPTAPI` constructor to log more info on the full prompt sent to the OpenAI chat completions API. You can override the `systemMessage` in `opts` to customize the assistant's instructions.
   *
   * @param message - The prompt message to send
   *
   * @returns The response from ChatGPT
   */
  async sendMessage(
    text: string,
    opts: EBSendMessageOptions = {},
  ): Promise<ChatMessage> {
    const {
      conversationId,
      parentMessageId,
      messageId = randomUUID(),
      ...rest
    } = opts;

    const latestQuestion: ChatMessage = {
      role: 'user',
      id: messageId,
      conversationId,
      parentMessageId,
      text,
    };

    const { messages } = await this._buildMessages(text, opts);

    // @ts-ignore
    const response = await this.api.chat.completions.create(
      {
        ...rest,
        model: 'ernie-bot',
        messages,
        stream: false,
      },
      {
        signal: opts.abortSignal,
      },
    );

    const result: ChatMessage = {
      role: 'assistant',
      id: response.id,
      conversationId,
      parentMessageId: messageId,
      text: response.result,
    };

    return Promise.all([
      this._upsertMessage(latestQuestion),
      this._upsertMessage(result),
    ]).then(() => result);
  }

  protected async _buildMessages(text: string, opts: SendMessageOptions) {
    let { parentMessageId } = opts;

    const userLabel = USER_LABEL_DEFAULT;
    const assistantLabel = ASSISTANT_LABEL_DEFAULT;

    const maxNumTokens = this._maxModelTokens - this._maxResponseTokens;
    let messages: any[] = [];

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

      const nextNumTokensEstimate = await this._getTokenCount(prompt);
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

      const parentMessage = await this._getMessageById(parentMessageId);
      if (!parentMessage) {
        break;
      }

      const parentMessageRole = parentMessage.role || 'user';

      nextMessages = nextMessages.slice(0, systemMessageOffset).concat([
        {
          role: parentMessageRole,
          content: parentMessage.text,
          name: parentMessage.name,
        },
        ...nextMessages.slice(systemMessageOffset),
      ]);

      parentMessageId = parentMessage.parentMessageId;
    } while (true);

    // Use up to 4096 tokens (prompt + response), but try to leave 1000 tokens
    // for the response.
    const maxTokens = Math.max(
      1,
      Math.min(this._maxModelTokens - numTokens, this._maxResponseTokens),
    );

    return { messages, maxTokens, numTokens };
  }

  protected async _getTokenCount(text: string) {
    // TODO: use a better fix in the tokenizer
    text = text.replace(/<\|endoftext\|>/g, '');

    return tokenizer.encode(text).length;
  }

  async _defaultGetMessageById(id: string): Promise<ChatMessage> {
    const res = await this._messageStore.get(id);
    return res!;
  }

  async _defaultUpsertMessage(message: ChatMessage): Promise<void> {
    await this._messageStore.set(message.id, message);
  }
}
