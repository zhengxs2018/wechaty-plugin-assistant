import {
  ChatClaudeAI,
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
    new ChatClaudeAI({
      apiOrg: process.env.CLAUDE_API_ORG!,
      sessionKey: process.env.CLAUDE_SESSION_KEY!,
    }),
  ]),
});

run(assistant);
