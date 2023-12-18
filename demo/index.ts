import {
  ChatERNIEBot,
  ChatQWen,
  MultiChatModelSwitch,
  createAssistant,
} from '../src';
import { WechatyBuilder } from 'wechaty';
import { EventLogger, QRCodeTerminal } from 'wechaty-plugin-contrib';

const ernie = new ChatERNIEBot({
  token: process.env.EB_ACCESS_TOKEN, // 飞桨平台的 token
});

const qwen = new ChatQWen({
  apiKey: process.env.QWEN_API_KEY,
})

const assistant = createAssistant({
  llm: new MultiChatModelSwitch([ernie, qwen])
});

const bot = WechatyBuilder.build({
  name: 'demo',
  puppet: 'wechaty-puppet-wechat4u',
  puppetOptions: { uos: true },
});

bot.use(QRCodeTerminal({ small: true }));
bot.use(EventLogger(['login', 'logout', 'error', 'friendship', 'room-invite']));

// 作为插件使用
bot.use(assistant.callback());

bot.start();
