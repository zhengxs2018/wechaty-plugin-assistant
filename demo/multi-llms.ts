import {
  ChatClaude,
  ChatERNIEBot,
  createAssistant,
  MultiChatModelSwitch,
} from '../src';
import { run } from './_wechaty';

const assistant = createAssistant({
  llm: new MultiChatModelSwitch([
    new ChatERNIEBot({
      token: process.env.EB_ACCESS_TOKEN,
    }),
    new ChatClaude({
      apiOrg: process.env.CLAUDE_API_ORG!,
      apiKey: process.env.CLAUDE_SESSION_KEY!,
      completionParams: {
        model: 'claude-instant-1',
      },
    }),
  ]),
});

run(assistant);
