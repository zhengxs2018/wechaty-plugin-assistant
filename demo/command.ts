import { ChatYiYan, createAssistant } from '../src';
import { run } from './_wechaty';

const llm = new ChatYiYan({
  cookies: process.env.BAIDU_COOKIE,
});

const assistant = createAssistant({
  llm,
});

// 注册自定义指令
assistant.command.register('ping', ctx => {
  ctx.reply('pong');
});

run(assistant);
