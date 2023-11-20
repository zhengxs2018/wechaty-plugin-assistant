import {
  ChatType,
  createAssistant,
  createMockContext,
  createMockTextMessage,
  defineLLM,
} from '../../src';

const llm = defineLLM({
  name: 'custom',
  human_name: '自定义',
  input_type: [ChatType.Text],
  call(context) {
    console.log('收到消息', context.message.text());

    context.reply('hi，我是自定义的模型');
  },
});

const assistant = createAssistant({
  llm: llm,
});

const ctx = createMockContext(createMockTextMessage('hello'));

assistant.call(ctx);
