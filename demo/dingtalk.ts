import { PuppetDingTalk } from '@zhengxs/wechaty-puppet-dingtalk';
import { WechatyBuilder } from 'wechaty';
import { EventLogger, QRCodeTerminal } from 'wechaty-plugin-contrib';

import {
  ChatERNIEBot,
  ChatQWen,
  createAssistant,
  MultiChatModelSwitch,
} from '../src';

const ernie = new ChatERNIEBot({
  token: process.env.EB_ACCESS_TOKEN, // 飞桨平台的 token
});

const qwen = new ChatQWen({
  apiKey: process.env.QWEN_API_KEY,
});

const assistant = createAssistant({
  llm: new MultiChatModelSwitch([ernie, qwen]),
  disabledOutdatedDetection: true, // 禁用过期消息检测
});

const bot = WechatyBuilder.build({
  name: 'demo',
  puppet: new PuppetDingTalk({
    clientId: process.env.DINGTALK_CLIENT_ID,
    clientSecret: process.env.DINGTALK_CLIENT_SECRET,
  }),
});

bot.use(QRCodeTerminal({ small: true }));
bot.use(EventLogger(['login', 'logout', 'error']));

// 作为插件使用
bot.use(assistant.callback());

bot.start();
