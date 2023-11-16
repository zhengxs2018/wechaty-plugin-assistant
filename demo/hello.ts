import { ChatERNIEBot, createAssistant } from '../src';
import { run } from './_wechaty';

const llm = new ChatERNIEBot({
  token: process.env.EB_ACCESS_TOKEN,
});

const assistant = createAssistant({
  llm,
});

run(assistant);
