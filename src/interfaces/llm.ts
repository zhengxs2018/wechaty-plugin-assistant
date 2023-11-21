import { type Assistant } from './assistant';
import { ChatType, type ConversationContext } from './context';
import { type PluginObject } from './plugin';
import { type MaybePromise } from './typescript';

// TODO 添加 features 或类型字段
// 以便于消息处理器可以根据消息类型进行分发
// 或者夸多模型消息调度
export interface ChatModel extends PluginObject {
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
