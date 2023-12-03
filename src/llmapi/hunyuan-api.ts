import { HunYuanAI, type HunYuanAIOptions } from '@zhengxs/ai';

import {
  ChatLLMAPI,
  type ChatLLMAPIOptions,
  type ChatMessage,
  type SendMessageOptions,
} from './llm-api';

export type HunYuanChatParams =
  Partial<HunYuanAI.ChatCompletionCreateParamsNonStreaming>;

export type HunYuanAPIOptions = HunYuanAIOptions &
  ChatLLMAPIOptions<HunYuanChatParams>;

export class HunYuanAPI extends ChatLLMAPI<HunYuanChatParams> {
  protected api: HunYuanAI;

  constructor(options: HunYuanAPIOptions = {}) {
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
        model: 'hunyuan',
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

    this.api = new HunYuanAI(rest);
  }

  protected override async makeRequest(
    question: ChatMessage,
    answer: ChatMessage,
    options: SendMessageOptions<HunYuanChatParams>,
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
