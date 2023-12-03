import { MinimaxAI, type MinimaxAIOptions } from '@zhengxs/ai';

import {
  ChatLLMAPI,
  type ChatLLMAPIOptions,
  type ChatMessage,
  type SendMessageOptions,
} from './llm-api';

export type MinimaxChatParams =
  Partial<MinimaxAI.ChatCompletionCreateParamsNonStreaming>;

export type MinimaxAPIOptions = MinimaxAIOptions &
  ChatLLMAPIOptions<MinimaxChatParams>;

export class MinimaxAPI extends ChatLLMAPI<MinimaxChatParams> {
  protected api: MinimaxAI;

  constructor(options: MinimaxAPIOptions = {}) {
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
        model: 'abab5-chat',
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

    this.api = new MinimaxAI(rest);
  }

  protected override async makeRequest(
    question: ChatMessage,
    answer: ChatMessage,
    options: SendMessageOptions<MinimaxChatParams>,
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
