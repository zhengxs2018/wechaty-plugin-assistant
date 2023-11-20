import {
  ChatClaudeAI,
  ChatERNIEBot,
  createAssistant,
  createMockContext,
  createMockTextMessage,
  MultiChatModelSwitch,
} from '../../src';

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

const ctx = createMockContext(createMockTextMessage('切换 claude'));

assistant.call(ctx);
