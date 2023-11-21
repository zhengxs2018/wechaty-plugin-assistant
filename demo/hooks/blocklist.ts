import { codeBlock } from 'common-tags';

import {
  createAssistant,
  createMockTextMessage,
  createRoomTextMockMessage,
  mockLLM,
} from '../../src';

const blocklist: string[] = ['mockTalkerId'];

const assistant = createAssistant({
  llm: mockLLM,
  onIndividualMessage(controller, assistant, message) {
    const talker = message.talker();

    if (blocklist.includes(talker.id) === false) return;

    controller.abort();

    talker.say(codeBlock`
    系统消息:

    你已被加入黑名单，请联系管理员解除!

    tag: onIndividualMessage`);
  },
  onRoomMentionSelfMessage(controller, assistant, message) {
    const talker = message.talker();

    if (blocklist.includes(talker.id) === false) return;

    controller.abort();

    const room = message.room()!;

    room.say(
      codeBlock`
      系统消息:

      你已被加入黑名单，请联系管理员解除!

      tag: onRoomMentionSelfMessage`,
      talker,
    );
  },
});

async function main() {
  assistant.run();

  await assistant.handler(createMockTextMessage());

  console.log('\n---------------\n');
  await assistant.handler(createRoomTextMockMessage());

  console.log('\n---------------\n');
  await assistant.handler(
    createMockTextMessage('我可以正常发私聊消息', {
      talkerId: 'normalTalkerId',
      talkerName: 'normalTalkerName',
    }),
  );

  console.log('\n---------------\n');
  await assistant.handler(
    createRoomTextMockMessage('我可以正常发房间消息', {
      talkerId: 'normalTalkerId',
      talkerName: 'normalTalkerName',
    }),
  );
}

main();
