import { codeBlock } from 'common-tags';

import commands from '../commands';
import { Command } from '../integrations/commander';
import { type Assistant, type AssistantConfig } from '../interfaces';
import { createAssistantMonitor } from './createAssistantMonitor';
import { resolveAssistantOptions } from './resolveAssistantOptions';
import { wechatyMessageHandler } from './wechatyMessageHandler';
import { wechatyPluginCallback } from './wechatyPluginCallback';

export function createAssistant(config: AssistantConfig) {
  const options = resolveAssistantOptions(config);

  const monitor = createAssistantMonitor();

  const program = new Command('program');

  const assistant: Assistant = {
    options,
    monitor,
    chatbotUser: null,
    wechaty: null,
    command: program,
    handler: message => wechatyMessageHandler(assistant, message),
    callback: () => {
      return bot => void wechatyPluginCallback(assistant, bot);
    },
    async call(ctx) {
      const { llm } = options;

      if (llm.input_type.includes(ctx.type)) {
        await llm.call(ctx, assistant);
      } else {
        ctx.reply(codeBlock`
        ⊶ 系统提示
        ﹊
        ${llm.human_name} 暂不支持处理此类消息！`);
      }
    },
    run() {
      monitor.running = true;
      monitor.startupTime = new Date();
    },
    stop() {
      monitor.running = false;
    },
  };

  program.addCommand(commands.deepl);
  program.addCommand(commands.dict);
  program.addCommand(commands.hot);
  program.addCommand(commands.moyu);
  program.addCommand(commands.kfc);

  return assistant;
}
