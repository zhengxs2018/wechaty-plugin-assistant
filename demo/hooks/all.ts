import {
  createAssistant,
  createMockTextMessage,
  createRoomTextMockMessage,
  mockLLM,
} from '../../src';

const assistant = createAssistant({
  llm: mockLLM,
  onMessage() {
    console.log('收到消息 onMessage');
  },
  onIndividualMessage() {
    console.log('收到消息 onIndividualMessage');
  },
  onRoomMessage() {
    console.log('收到消息 onRoomMessage');
  },
  onRoomMentionSelfMessage() {
    console.log('收到消息 onRoomMentionSelfMessage');
  },
  onContextCreated() {
    console.log('上下文创建 onContextCreated');
  },
  onPrepareTextMessage() {
    console.log('处理文本消息 onPrepareTextMessage');
  },
  onContextDestroyed() {
    console.log('上下文销毁 onContextDestroyed');
  },
});

async function main() {
  assistant.run();

  await assistant.handler(createMockTextMessage());

  console.log('\n---------------\n');
  await assistant.handler(createRoomTextMockMessage());
}

main();
