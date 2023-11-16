import { ChatYiYan, createAssistant } from '../src';
import { run } from './_wechaty';

const llm = new ChatYiYan({
  cookies: process.env.BAIDU_COOKIE,
});

const assistant = createAssistant({
  llm,
});

run(assistant);
