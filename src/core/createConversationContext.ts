import { FileBox, type FileBoxInterface } from 'file-box';
import { log, type Message, type Sayable } from 'wechaty';

import {
  type Assistant,
  ChatType,
  type ConversationContext,
} from '../interfaces';
import { md5, sleep } from '../util';
import { createConversationSession } from './createConversationSession';
import { createUserConfig } from './createUserConfig';

export async function createConversationContext(
  controller: AbortController,
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
    llm,
    options: { debug, maintainers, cache },
  } = assistant;

  const [conversationTitle, chatbotUserName, userConfig, session] =
    await Promise.all([
      room?.topic(),
      message.wechaty.currentUser.name(),
      createUserConfig(cache, talkerId, talkerName),
      createConversationSession(cache, conversationId),
    ]);

  // 消息日志
  if (debug) {
    if (room) {
      log.info(
        `🤖️ [${message.id}] 在房间 (${conversationTitle}) 收到(${talkerName}@${talkerId})的消息`,
      );
    } else {
      log.info(`🤖️ [${message.id}] 收到(${talkerName}@${talkerId})的消息`);
    }
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
    // Note: 正常情况下，LLM 模型应该通过 control signal 来控制对话的结束
    // 但某些代理模型，如 bing chat 使用 wss，无法通过 control signal 来控制对话的结束
    // 这里通过 ctx.aborted 来强制退出对话
    if (ctx.aborted) return;

    // TODO: 是否可以直接使用 message.say 方法
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

    if (finished && debug) {
      // 消息日志
      if (room) {
        log.info(
          `🤖️ [${message.id}] 在房间 (${conversationTitle}) 回复 (${talkerName}@${talkerId}) 的消息`,
        );
      } else {
        log.info(`🤖️ [${message.id}] 回复(${talkerName}@${talkerId})的消息`);
      }
    }
  }

  const dispose = async () => {
    await assistant.hooks.onContextDestroyed.process(
      controller,
      ctx,
      assistant,
    );

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

  function createLock() {
    ctx.lock = monitor.defineLock({
      id: conversationId,
      messageId: message.id,
      conversationTitle,
      talkerId: talkerId,
      talkerName: talkerName,
    });

    return ctx.lock;
  }

  const ctx: ConversationContext = {
    assistant,
    llm: llm,
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
    createLock,
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
      // Note: 强制中止对话
      // 以支持某些口令，如：切换模型，停止对话
      createLock().abort(reason);
    },
    get aborted() {
      return ctx.lock?.controller.signal.aborted ?? false;
    },
    dispose,
  };

  await assistant.hooks.onContextCreated.process(controller, ctx, assistant);

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
