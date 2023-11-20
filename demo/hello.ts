import { WechatyBuilder } from 'wechaty';
import { EventLogger, QRCodeTerminal } from 'wechaty-plugin-contrib';

import { ChatERNIEBot, createAssistant } from '../src';

const assistant = createAssistant({
  llm: new ChatERNIEBot({
    token: process.env.EB_ACCESS_TOKEN,
  }),
});

const bot = WechatyBuilder.build({
  name: 'demo',
  puppet: 'wechaty-puppet-wechat4u',
  puppetOptions: { uos: true },
});

bot.use(QRCodeTerminal({ small: true }));
bot.use(EventLogger(['login', 'logout', 'error', 'friendship', 'room-invite']));

bot.use(assistant.callback());

bot.start();
