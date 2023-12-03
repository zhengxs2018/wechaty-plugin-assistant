import {
  ChatHunYuan,
  createMockContext,
  createMockTextMessage,
} from '../../src';

const llm = new ChatHunYuan();

const ctx = createMockContext(createMockTextMessage('hello'));

llm.call(ctx);
