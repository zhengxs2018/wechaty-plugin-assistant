import { codeBlock } from 'common-tags';

import { Command } from '../integrations/commander';
import { deepl } from '../commands'
import { type Assistant, type AssistantConfig } from '../interfaces';
import { createAssistantHooks } from './createAssistantHooks';
import { createAssistantMonitor } from './createAssistantMonitor';
import { resolveAssistantOptions } from './resolveAssistantOptions';
import { setupConfigAndLLM } from './setupConfigAndLLM';
import { wechatyMessageHandler } from './wechatyMessageHandler';
import { wechatyPluginCallback } from './wechatyPluginCallback';

import { keywords } from './keywords'

export function createAssistant(config: AssistantConfig) {
  const options = resolveAssistantOptions(config);

  const hooks = createAssistantHooks();
  const monitor = createAssistantMonitor();

  const program = new Command('program');

  const { llm } = options;

  const assistant: Assistant = {
    options,
    monitor,
    hooks,
    chatbotUser: null,
    wechaty: null,
    command: program,
    keywords,
    llm,
    handler: message => wechatyMessageHandler(assistant, message),
    callback: () => {
      return bot => void wechatyPluginCallback(assistant, bot);
    },
    async call(ctx) {
      if (llm.input_type.includes(ctx.type)) {
        await llm.call(ctx, assistant);
      } else {
        ctx.reply(codeBlock`
        ⊶ 系统提示
        ﹊
        ${llm.human_name} 暂不支持处理此类消息！
        -------------------
        输入 "帮助" 获取更详细的使用说明。`);
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

  program.addCommand(deepl)

  setupConfigAndLLM(options, assistant);

  return assistant;
}
