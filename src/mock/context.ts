import { Message, type Sayable } from 'wechaty';

import { resolveChatType } from '../core';
import { type ConversationContext } from '../interfaces';
import { md5 } from '../util';
import { createMockTextMessage } from './message';

/**
 * 创建一个模拟的对话上下文
 * 主要用于示例代码的测试
 *
 * @param message -
 * @returns
 */
export const createMockContext = (
  message: Message = createMockTextMessage(),
) => {
  const talker = message.talker();
  const talkerId = talker.id;
  const talkerName = talker.name();

  const room = message.room();
  const roomId = room?.id;

  const conversationId = md5(roomId ? `${roomId}:${talkerId}` : talkerId);

  const controller = new AbortController();

  return {
    conversationId: conversationId,
    talkerId: talkerId,
    talkerName: talkerName,
    chatbotUserName: message.wechaty.currentUser.name(),
    isAdmin: false,
    type: resolveChatType(message),
    message: message,
    session: {} as any,
    userConfig: {} as any,
    createLock() {
      return {
        id: 'testLockId',
        createdAt: Date.now(),
        controller: controller,
        abort: () => controller.abort(),
        dispose: () => void 0,
      };
    },
    releaseLock: () => void 0,
    isLocked: false,
    get aborted() {
      return controller.signal.aborted;
    },
    abort: () => controller.abort(),
    async reply(sayable: Sayable) {
      message.say(sayable);
    },
    sendFileFromUrl(url: string, name?: string) {
      console.log('sendFileFromUrl', url, name);
      return Promise.resolve();
    },
    sendFileBox(file: any, callback: (err: Error) => any) {
      console.log('sendFileBox', file, callback);
      return Promise.resolve();
    },
    dispose: () => void 0,
  } as unknown as ConversationContext;
};
