import {
  ChatType,
  createAssistant,
  createMockTextMessage,
  MultiChatModelSwitch,
} from '../../src';

const assistant = createAssistant({
  llm: new MultiChatModelSwitch([
    {
      name: 'yiyan',
      human_name: '文心一言',
      input_type: [ChatType.Text],
      call(ctx) {
        console.log('[文心一言] 收到', ctx.message.text());
      },
    },
    {
      name: 'xinghuo',
      human_name: '讯飞星火',
      input_type: [ChatType.Text],
      call(ctx) {
        console.log('[讯飞星火] 收到', ctx.message.text());
      },
    },
  ]),
});

async function main() {
  assistant.run();

  console.log('查看模型\n');
  await assistant.handler(createMockTextMessage('查看模型'));
  console.log('\n')
  await assistant.handler(createMockTextMessage('第一次对话'));

  console.log('\n---------------\n');
  console.log('切换星火\n');
  await assistant.handler(createMockTextMessage('切换星火'));
  console.log('\n')
  await assistant.handler(createMockTextMessage('第二次对话'));

  console.log('\n---------------\n');
  console.log('查看模型\n');
  await assistant.handler(createMockTextMessage('查看模型'));
  console.log('\n')
  await assistant.handler(createMockTextMessage('第三次对话'));
}

main();
