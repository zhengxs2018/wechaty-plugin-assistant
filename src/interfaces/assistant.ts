import {
  type ContactSelf,
  type Message,
  type Wechaty,
  type WechatyPlugin,
} from 'wechaty';

import { type Command } from '../integrations';
import { type ChatModel } from './llm';
import { type Keywords } from './keywords';
import { type ConversationContext } from './context';
import { type HookQueue, type HooksName } from './hooks';
import { type AssistantMonitor } from './monitor';
import { type AssistantOptions } from './options';

export type AssistantHooks = {
  [K in HooksName]: HookQueue<K>;
};

export interface Assistant {
  /**
   * 助手的配置
   */
  options: AssistantOptions;

  /**
   * 助手的监控器
   */
  monitor: AssistantMonitor;

  /**
   * 聊天指令
   */
  command: Command;

  /**
   * 关键词
   */
  keywords: Keywords;

  /**
   * 助手的钩子
   */
  hooks: AssistantHooks;

  llm: ChatModel

  /**
   * 当前机器人登录的用户
   */
  chatbotUser?: ContactSelf | null;

  /**
   * wechaty 实例
   */
  wechaty?: Wechaty | null;

  /**
   * 消息监听器
   */
  handler: (message: Message) => Promise<void>;

  /**
   * 插件回调
   */
  callback: () => WechatyPlugin;

  /**
   * 调用大语言模型
   */
  call(ctx: ConversationContext): Promise<void>;

  /**
   * 启动助手
   */
  run(): void;

  /**
   * 停止助手
   */
  stop(): void;
}
