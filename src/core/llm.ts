import { type Assistant } from './createAssistant';
import { type ConversationContext } from './createConversationContext';

type MaybePromise<T> = T | Promise<T>;

export interface ChatModel {
  /**
   * 名称
   */
  name: string;

  /**
   * 人类可读名称
   */
  human_name: string;

  /**
   * @param context -
   * @param assistant-
   */
  call(context: ConversationContext, assistant: Assistant): MaybePromise<any>;
}

export const defineLLM = (model: ChatModel): ChatModel => model;
