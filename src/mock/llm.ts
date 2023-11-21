import { defineLLM } from '../helpers';
import { ChatType } from '../interfaces';

export const mockLLM = defineLLM({
  name: 'mock',
  human_name: 'mock',
  input_type: [ChatType.Text],
  async call(ctx) {
    console.log('收到消息', ctx.message.text());
    ctx.reply('MockLLM: 收到消息');
  },
});
