import {
  ChatClaudeAI,
  createMockContext,
  createMockTextMessage,
} from '../../src';

const llm = new ChatClaudeAI({
  apiOrg: process.env.CLAUDE_API_ORG!,
  sessionKey: process.env.CLAUDE_SESSION_KEY!,
});

const ctx = createMockContext(createMockTextMessage('hello'));

llm.call(ctx);
