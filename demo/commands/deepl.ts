import {
  createAssistant,
  createMockContext,
  createMockTextMessage,
} from '../../src';

const assistant = createAssistant({
  llm: {
    name: 'custom',
    human_name: '自定义',
    input_type: [],
    call(context) {
      console.log('收到消息', context.message.text());

      context.reply('hi，我是自定义的模型');
    },
  },
});

const ctx = createMockContext(createMockTextMessage('hello'));

assistant.command.parse(ctx, ['/deepl', '张', '-f', 'zh', '-t', 'ja']);
// ⊶ 翻译结果
// ﹊
// 用紙

// 备选结果：

//  - ようし
//  - 紙
//  - 紙一枚
