import {
  ChatAIStudio,
  ChatYiYan,
  createAssistant,
  MultiChatModelSwitch,
} from '../src';
import { run } from './_wechaty';

const assistant = createAssistant({
  llm: new MultiChatModelSwitch([
    new ChatAIStudio({
      cookie: process.env.BAIDU_COOKIE!,
    }),
    new ChatYiYan({
      cookies: process.env.BAIDU_COOKIE,
    }),
  ]),
});

run(assistant);
