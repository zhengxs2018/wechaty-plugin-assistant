import { WechatyBuilder } from 'wechaty';
import { EventLogger, QRCodeTerminal } from 'wechaty-plugin-contrib';

import { type Assistant } from '../src';

export function run(assistant: Assistant) {
  const bot = WechatyBuilder.build({
    name: 'demo',
    puppet: 'wechaty-puppet-wechat4u',
    puppetOptions: { uos: true },
  });

  bot.use(QRCodeTerminal({ small: true }));
  bot.use(
    EventLogger(['login', 'logout', 'error', 'friendship', 'room-invite']),
  );

  bot.use(assistant.callback());

  bot.start();
}
