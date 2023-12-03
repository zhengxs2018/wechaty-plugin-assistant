import { OpenAI, type ClientOptions } from 'openai';

import {
  ChatLLMAPI,
  type ChatLLMAPIOptions,
  type ChatMessage,
  type SendMessageOptions,
} from './llm-api';

export type OpenAIChatParams =
  Partial<OpenAI.ChatCompletionCreateParamsNonStreaming>;

export type ChatGPTAPIOptions = ClientOptions &
  ChatLLMAPIOptions<OpenAIChatParams>;

export class ChatGPTAPI extends ChatLLMAPI<OpenAIChatParams> {
  protected api: OpenAI;

  constructor(options: ChatGPTAPIOptions = {}) {
    const {
      debug,
      chatParams,
      maxModelTokens,
      maxResponseTokens,
      messageStore,
      userLabel,
      assistantLabel,
      encoding,
      getMessageById,
      upsertMessage,
      systemMessage,
      ...rest
    } = options;

    super({
      debug,
      chatParams: {
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        top_p: 1.0,
        ...chatParams,
      },
      maxModelTokens,
      maxResponseTokens,
      messageStore,
      systemMessage,
      userLabel,
      assistantLabel,
      encoding,
      getMessageById,
      upsertMessage,
    });

    this.api = new OpenAI(rest);
  }

  protected override async makeRequest(
    question: ChatMessage,
    answer: ChatMessage,
    options: SendMessageOptions<OpenAIChatParams>,
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
