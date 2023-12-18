import {
  kfc,
  ChatType,
  createAssistant,
  createMockTextMessage,
  MultiChatModelSwitch,
} from '../src';

const assistant = createAssistant({
  llm: new MultiChatModelSwitch([
    {
      name: 'yiyan',
      human_name: '文心一言',
      input_type: [ChatType.Text],
      summary: '文心一言 [百度]',
      call(ctx) {
        console.log('[文心一言] 收到', ctx.message.text());
      },
    },
    {
      name: 'xinghuo',
      human_name: '星火认知 [讯飞]',
      input_type: [ChatType.Text],
      call(ctx) {
        console.log('[讯飞星火] 收到', ctx.message.text());
      },
    },
  ]),
});

assistant.command.addCommand(kfc)

async function main() {
  assistant.run();

  await assistant.handler(createMockTextMessage('帮助'));
}

main();
