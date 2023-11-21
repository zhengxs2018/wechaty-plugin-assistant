import { Message, type Sayable } from 'wechaty';

type MockMessageOptions = {
  talkerId?: string;
  talkerName?: string;
  roomId?: string;
  roomName?: string;
};

/**
 * 创建一个模拟的消息
 *
 * @param text -
 * @returns
 */
export const createMockTextMessage = (
  text?: string,
  options: MockMessageOptions = {},
) => {
  const payload = {
    text: text || 'hello',
  };
  return {
    id: 'testMessageId',
    payload,
    text: () => payload.text,
    type: () => 7,
    say: (sayable: Sayable) => Promise.resolve(console.log(sayable)),
    talker: () => ({
      id: options.talkerId ?? 'mockTalkerId',
      name: () => options.talkerName ?? 'mockTalkerName',
      type: () => 1,
      say: (sayable: Sayable) => Promise.resolve(console.log(sayable)),
    }),
    room() {
      return undefined;
    },
    mentionSelf: () => Promise.resolve(true),
    conversation: () => ({
      id: 'testConversationId',
    }),
    self: () => false,
    date: () => Date.now(),
    wechaty: {
      Message: {
        Type: {
          Text: 7,
        },
      },
      Contact: {
        Type: {
          Individual: 1,
        },
      },
      currentUser: {
        name: () => 'testChatbotUserName',
      },
    },
  } as unknown as Message;
};

export function createRoomTextMockMessage(
  text?: string,
  options: MockMessageOptions = {},
) {
  const message = createMockTextMessage(text, options);

  message.room = () => ({
    id: options.roomId ?? 'mockRoomId',
    // @ts-ignore
    topic: () => Promise.resolve(options.roomName ?? 'mockRoomName'),
    // @ts-ignore
    say: (sayable: Sayable) => Promise.resolve(console.log(sayable)),
  });

  return message as unknown as Message;
}
