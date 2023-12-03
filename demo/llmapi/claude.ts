import { ClaudeAI } from '../../src';

const model = new ClaudeAI({
  // See https://openai-proxy.apifox.cn/
  apiOrg: process.env.CLAUDE_API_ORG!,
  sessionKey: process.env.CLAUDE_SESSION_KEY!,
});

async function main() {
  const res0 = await model.sendMessage('Hello!');

  console.log('assistant', res0.text);

  const res1 = await model.sendMessage('Repeat what I said earlier.', {
    // @ts-expect-error TODO 类型需要处理
    conversationId: res0.conversationId,
  });

  console.log('assistant', res1.text);
}

main();
