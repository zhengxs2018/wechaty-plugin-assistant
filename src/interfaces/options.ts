import { type MemoryCache } from './cache';
import { type ChatModel } from './llm';
import type { PluginObject } from './plugin';

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
   * 维护者列表
   */
  maintainers?: string[];
};

export type AssistantConfig = AssistantConfigBase & Omit<PluginObject, 'name'>;

export type AssistantOptions = Required<AssistantConfigBase> &
  Omit<PluginObject, 'name'>;
