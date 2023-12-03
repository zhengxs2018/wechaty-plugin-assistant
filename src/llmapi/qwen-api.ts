import { QWenAI, type QWenAIOptions } from '@zhengxs/ai';

import {
  ChatLLMAPI,
  type ChatLLMAPIOptions,
  type ChatMessage,
  type SendMessageOptions,
} from './llm-api';

export type QWenChatParams =
  Partial<QWenAI.ChatCompletionCreateParamsNonStreaming>;

export type QWenAPIOptions = QWenAIOptions &
  ChatLLMAPIOptions<QWenChatParams>;

export class QWenAPI extends ChatLLMAPI<QWenChatParams> {
  protected api: QWenAI;

  constructor(options: QWenAPIOptions = {}) {
    const {
      debug,
      systemMessage,
      chatParams,
      maxModelTokens,
      maxResponseTokens,
      messageStore,
      userLabel,
      assistantLabel,
      encoding,
      getMessageById,
      upsertMessage,
      ...rest
    } = options;

    super({
      debug,
      systemMessage,
      chatParams: {
        model: 'qwen-max',
        temperature: 0.8,
        top_p: 1.0,
        ...chatParams,
      },
      maxModelTokens,
      maxResponseTokens,
      messageStore,
      userLabel,
      assistantLabel,
      encoding,
      getMessageById,
      upsertMessage,
    });

    this.api = new QWenAI(rest);
  }

  protected override async makeRequest(
    question: ChatMessage,
    answer: ChatMessage,
    options: SendMessageOptions<QWenChatParams>,
  ): Promise<void> {
    const { chatParams } = options;
    const { messages } = await this.buildMessages(question.text, options);

    // @ts-expect-error
    const chatCompletion = await this.api.chat.completions.create({
      ...this.chatParams,
      ...chatParams,
      messages,
      stream: false,
    });

    const choice = chatCompletion.choices[0]!;

    answer.text = choice.message.content!;
  }
}
