import {
  type ContactSelf,
  Message,
  type Wechaty,
  type WechatyPlugin,
} from 'wechaty';

import { Command } from './commander';
import {
  type AssistantMonitor,
  createAssistantMonitor,
} from './createAssistantMonitor';
import { type ConversationContext } from './createConversationContext';
import {
  type AssistantConfig,
  type AssistantOptions,
  resolveAssistantOptions,
} from './resolveAssistantOptions';
import { wechatyMessageHandler } from './wechatyMessageHandler';
import { wechatyPluginCallback } from './wechatyPluginCallback';

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
  call(ctx: ConversationContext): Promise<string>;

  /**
   * 启动助手
   */
  run(): void;

  /**
   * 停止助手
   */
  stop(): void;
}

export function createAssistant(config: AssistantConfig) {
  const options = resolveAssistantOptions(config);

  const monitor = createAssistantMonitor();

  const assistant: Assistant = {
    options,
    monitor,
    chatbotUser: null,
    wechaty: null,
    command: new Command('assistant'),
    handler: message => wechatyMessageHandler(assistant, message),
    callback: () => {
      return bot => void wechatyPluginCallback(assistant, bot);
    },
    call(ctx) {
      return options.llm.call(ctx, assistant);
    },
    run() {
      monitor.running = true;
      monitor.startupTime = new Date();
    },
    stop() {
      monitor.running = false;
    },
  };

  return assistant;
}
