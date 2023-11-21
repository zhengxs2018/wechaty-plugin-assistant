import { type Message } from 'wechaty';

import { type Assistant } from './assistant';
import { type MemoryCache } from './cache';
import { type ChatModel } from './llm';

export type AssistantNotifications = {
  /**
   * 消息发送失败
   */
  messageProcessFailed: (
    error: Error,
    message: Message,
    assistant: Assistant,
  ) => void;
};

/**
 * 超过一定大小的图会发送失败
 * 需要对图片进行压缩
 *
 * @param src - 图片地址
 * @param name - 文件名称
 * @returns 压缩后的图片地址
 */
export type ImageCompressor = (src: string, name?: string) => Promise<string>;

export type Compressors = {
  image: ImageCompressor;
};

export type AssistantConfig = {
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

  /**
   * 内部派发的各种通知
   */
  notifications?: AssistantNotifications | null;

  /**
   * 各种压缩器
   *
   * 解决文件过大，消息发送失败的问题
   */
  compressors?: Compressors | null;

  /**
   * 是否跳过不支持的消息类型，由下一个机器人处理
   *
   * TODO 未来考虑支持
   */
  skipUnsupportedMessage?: boolean;
};

export type AssistantOptions = Required<AssistantConfig>;
