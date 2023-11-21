import { type Wechaty } from 'wechaty';

import { type Assistant } from '../interfaces';

export async function wechatyPluginCallback(
  assistant: Assistant,
  bot: Wechaty,
) {
  const { monitor } = assistant;

  // Note: 为了方便调试，暴露出来
  assistant.wechaty = bot;

  bot.on('message', assistant.handler);

  bot.on('login', user => {
    monitor.started = true;
    monitor.startupTime = new Date();

    monitor.running = true;

    // 当前机器人的用户
    assistant.chatbotUser = user;
  });

  bot.on('logout', () => {
    monitor.started = false;

    monitor.running = false;

    assistant.chatbotUser = undefined;
  });
}
