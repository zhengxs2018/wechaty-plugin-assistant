import { HunYuanAPI } from '../../src';

const api = new HunYuanAPI();

async function main() {
  const res0 = await api.sendMessage('你好!');

  console.log('assistant', res0.text);

  const res1 = await api.sendMessage('我刚刚说了什么', {
    parentMessageId: res0.id,
  });

  console.log('assistant', res1.text);
}

main();
