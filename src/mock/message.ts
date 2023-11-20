import { Message, type Sayable } from 'wechaty';

/**
 * 创建一个模拟的消息
 *
 * @param text -
 * @returns
 */
export const createMockTextMessage = (text?: string) =>
  ({
    text: () => text || 'hello',
    type: () => 7,
    say: (sayable: Sayable) => Promise.resolve(console.log(sayable)),
    talker: () => ({
      id: 'testTalkerId',
      name: () => 'testTalkerName',
    }),
    room() {
      return undefined;
    },
    conversation: () => ({
      id: 'testConversationId',
    }),
    wechaty: {
      Message: {
        Type: {
          Text: 7,
        },
      },
      currentUser: {
        name: () => 'testChatbotUserName',
      },
    },
  }) as unknown as Message;
