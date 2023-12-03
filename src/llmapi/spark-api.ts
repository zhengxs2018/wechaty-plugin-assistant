import { SparkAI, type SparkAIOptions } from '@zhengxs/ai';

import {
  ChatLLMAPI,
  type ChatLLMAPIOptions,
  type ChatMessage,
  type SendMessageOptions,
} from './llm-api';

export type SparkChatParams =
  Partial<SparkAI.ChatCompletionCreateParamsNonStreaming>;

export type SparkAPIOptions = SparkAIOptions &
  ChatLLMAPIOptions<SparkChatParams>;

export class SparkAPI extends ChatLLMAPI<SparkChatParams> {
  protected api: SparkAI;

  constructor(options: SparkAPIOptions = {}) {
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
        model: 'spark-3',
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

    this.api = new SparkAI(rest);
  }

  protected override async makeRequest(
    question: ChatMessage,
    answer: ChatMessage,
    options: SendMessageOptions<SparkChatParams>,
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
