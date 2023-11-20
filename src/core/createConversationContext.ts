import { FileBox, type FileBoxInterface } from 'file-box';
import { log, type Message, type Sayable } from 'wechaty';

import { md5, sleep } from '../util';
import { type Assistant } from './createAssistant';
import { type LockInfo } from './createAssistantMonitor';
import {
  type ConversationSession,
  createConversationSession,
} from './createConversationSession';
import {
  createConversationUserConfig,
  type UserConfig,
} from './createConversationUserConfig';

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
  session: ConversationSession;

  /**
   * 用户配置
   */
  userConfig: UserConfig;

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
  dispose: () => void;
};

export async function createConversationContext(
  assistant: Assistant,
  message: Message,
): Promise<ConversationContext> {
  const talker = message.talker();
  const talkerId = talker.id;
  const talkerName = talker.name();

  const room = message.room();
  const roomId = room?.id;

  // 隔离同一个人在私聊和群聊中的上下文
  const conversationId = md5(roomId ? `${roomId}:${talkerId}` : talkerId);

  const {
    monitor,
    options: { maintainers, cache },
  } = assistant;

  const [conversationTitle, chatbotUserName, userConfig, session] =
    await Promise.all([
      room?.topic(),
      message.wechaty.currentUser.name(),
      createConversationUserConfig(cache, talkerId),
      createConversationSession(cache, conversationId),
    ]);

  // 消息日志
  if (room) {
    log.info(
      `🤖️ [${message.id}] 在房间 (${conversationTitle}) 收到(${talkerName}@${talkerId})的消息`,
    );
  } else {
    log.info(`🤖️ [${message.id}] 收到(${talkerName}@${talkerId})的消息`);
  }

  /**
   * @param sayable - 可以被发送的内容
   * @param finished - 是否结束对话，仅用于输出日志
   * @param bubble - 是否使用纯气泡模式
   * @returns
   */
  async function reply(
    sayable: Sayable,
    finished?: boolean,
    bubble?: boolean,
  ): Promise<void> {
    if (room) {
      if (typeof sayable === 'string' || bubble === false) {
        // 群聊中让消息更好看
        await room.say(`\n\n ${sayable}`, talker);
      } else {
        await room.say(sayable);
      }
    } else {
      await talker.say(sayable);
    }

    if (!finished) return;

    // 消息日志
    if (room) {
      log.info(
        `🤖️ [${message.id}] 在房间 (${conversationTitle}) 回复 (${talkerName}@${talkerId}) 的消息`,
      );
    } else {
      log.info(`🤖️ [${message.id}] 回复(${talkerName}@${talkerId})的消息`);
    }
  }

  const dispose = () => {
    session.restore();
    userConfig.restore();
  };

  async function sendFileBox(
    file: FileBoxInterface,
    callback: (err: Error) => any,
  ) {
    await reply(file).then(
      () => sleep(460),
      err => callback(err),
    );
  }

  async function sendFileFromUrl(url: string, name?: string) {
    await sendFileBox(FileBox.fromUrl(url, { name }), () => ctx.reply(url));
  }

  const ctx: ConversationContext = {
    conversationId,
    conversationTitle,
    talkerId,
    talkerName,
    chatbotUserName,
    isAdmin: maintainers.includes(talkerId),
    userConfig,
    session,
    type: resolveChatType(message),
    message,
    reply,
    sendFileBox,
    sendFileFromUrl,
    lock: null,
    createLock() {
      ctx.lock = monitor.defineLock({
        id: conversationId,
        messageId: message.id,
        conversationTitle,
        talkerId: talkerId,
        talkerName: talkerName,
      });

      return ctx.lock;
    },
    releaseLock() {
      monitor.releaseLock(conversationId);
    },
    get isLocked() {
      return monitor.isLocked(conversationId);
    },
    get signal() {
      return ctx.lock?.controller.signal;
    },
    abort(reason) {
      ctx.lock?.abort(reason);
    },
    get aborted() {
      return ctx.lock?.controller.signal.aborted ?? false;
    },
    dispose,
  };

  return ctx;
}

export function resolveChatType(message: Message): ChatType {
  const Type = message.wechaty.Message.Type;

  switch (message.type()) {
    case Type.Text:
      return ChatType.Text;
    case Type.Image:
      return ChatType.Image;
    case Type.Audio:
      return ChatType.Audio;
    case Type.Video:
      return ChatType.Video;
    case Type.Attachment:
      return ChatType.File;
    default:
      return ChatType.Unknown;
  }
}
