import { type FileBoxInterface } from 'file-box';
import { type Message, type Sayable } from 'wechaty';

import { type State } from './cache';
import { type LockInfo } from './lock';

/**
 * 输入类型
 */
export enum ChatType {
  Text = 'text',
  Image = 'image',
  Audio = 'audio',
  Video = 'video',
  File = 'file',
  Unknown = 'unknown',
}

export type ConversationContext = {
  /**
   * 对话ID
   */
  conversationId: string;

  /**
   * 对话标题
   */
  conversationTitle?: string;

  /**
   * 发送者ID
   */
  talkerId: string;

  /**
   * 发送者昵称
   */
  talkerName: string;

  /**
   * 聊天机器人的名称
   */
  chatbotUserName: string;

  /**
   * 是否是管理员
   */
  isAdmin: boolean;

  /**
   * 聊天类型
   */
  type: ChatType;

  /**
   * 消息内容 {@link Message}
   */
  message: Message;

  /**
   * 临时数据
   */
  session: State;

  /**
   * 用户配置
   */
  userConfig: State;

  /**
   * 快速回复给发送者
   *
   * @param sayable - 可以被发送的内容
   * @param finished - 是否结束对话，仅用于输出日志
   */
  reply: (sayable: Sayable, finished?: boolean) => Promise<void>;

  /**
   * 发送远程文件给发送者
   *
   * 每次文件发送后，会等待 460ms
   */
  sendFileFromUrl(url: string, name?: string): Promise<void>;

  /**
   * 发送文件给发送者
   *
   * 每次文件发送后，会等待 460ms
   */
  sendFileBox(
    file: FileBoxInterface,
    callback: (err: Error) => any,
  ): Promise<void>;

  /**
   * 创建一个锁定 {@link LockInfo}
   * @returns
   */
  createLock: () => LockInfo;

  /**
   * 释放锁定 {@link LockInfo}
   */
  releaseLock: () => void;

  /**
   * 当前上下文锁对象 {@link LockInfo}
   */
  lock?: LockInfo | null;

  /**
   * 中断信号
   */
  readonly signal: AbortSignal | undefined;

  /**
   * 是否被锁定
   *
   * 解决同一个人发送多条消息时，多次触发对话的问题
   */
  readonly isLocked: boolean;

  /**
   * 中断对话 {@link LockInfo.abort}
   */
  abort: (reason?: any) => void;

  /**
   * 是否已经中断 {@link LockInfo.aborted}
   */
  readonly aborted: boolean;

  /**
   * 释放资源，并存储过程数据
   */
  dispose: () => Promise<void>;
};
