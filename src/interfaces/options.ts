import { type MemoryCache } from './cache';
import { ConversationContext } from './context';
import { type ChatModel } from './llm';
import type { PluginObject } from './plugin';
import { MaybePromise } from './typescript';

type AssistantConfigBase = {
  /**
   * 是否开启调试模式
   */
  debug?: boolean;

  /**
   * 是否开启测试模式
   */
  testing?: boolean;

  /**
   * 大语言模型
   */
  llm: ChatModel;

  /**
   * 缓存
   */
  cache?: MemoryCache;

  /**
   * 输出帮助信息
   */
  help?: (ctx: ConversationContext) => MaybePromise<void>;

  /**
   * 维护者列表
   */
  maintainers?: string[];
};

export type AssistantConfig = AssistantConfigBase & Omit<PluginObject, 'name'>;

export type AssistantOptions = Required<AssistantConfigBase> &
  Omit<PluginObject, 'name'>;
