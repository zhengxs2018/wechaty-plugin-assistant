import {
  ChatERNIEBot,
  createMockContext,
  createMockTextMessage,
} from '../../src';

const llm = new ChatERNIEBot({
  token: process.env.EB_ACCESS_TOKEN,
});

const ctx = createMockContext(createMockTextMessage('hello'));

llm.call(ctx);
