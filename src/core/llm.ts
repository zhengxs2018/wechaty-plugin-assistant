import { type Assistant } from './createAssistant';
import {
  ChatType,
  type ConversationContext,
} from './createConversationContext';

type MaybePromise<T> = T | Promise<T>;

// TODO 添加 features 或类型字段
// 以便于消息处理器可以根据消息类型进行分发
// 或者夸多模型消息调度
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
   * 支持的输出类型
   */
  input_type: ChatType[];

  /**
   * @param context -
   * @param assistant-
   */
  call(context: ConversationContext, assistant: Assistant): MaybePromise<void>;
}

export const defineLLM = (model: ChatModel): ChatModel => model;
