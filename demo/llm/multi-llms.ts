import { codeBlock } from 'common-tags';

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
      greeting: codeBlock`
      您好，我是讯飞星火认知大模型!

      能够学习和理解人类的语言，进行多轮对话。

      回答问题，高效便捷地帮助人们获取信息、知识和灵感。`,
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
  console.log('\n');
  await assistant.handler(createMockTextMessage('第一次对话'));

  console.log('\n---------------\n');
  console.log('切换星火\n');
  await assistant.handler(createMockTextMessage('切换星火'));
  console.log('\n');
  await assistant.handler(createMockTextMessage('第二次对话'));

  console.log('\n---------------\n');
  console.log('查看模型\n');
  await assistant.handler(createMockTextMessage('查看模型'));
  console.log('\n');
  await assistant.handler(createMockTextMessage('第三次对话'));
}

main();
