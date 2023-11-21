import { ChatType, createAssistant, createMockContext } from '../../src';

const assistant = createAssistant({
  llm: {
    name: 'mock',
    human_name: 'mock',
    input_type: [ChatType.Text],
    async call(ctx) {
      ctx.reply('mock');
    },
  },
});

// 注册自定义指令
assistant.command.register('ping', ctx => {
  ctx.reply('pong');
});

const ctx = createMockContext();

assistant.command.parse(ctx, ['/ping']);
