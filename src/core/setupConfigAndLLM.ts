import { Assistant, AssistantOptions } from '../interfaces';
import { PluginObject } from '../interfaces/plugin';

export function setupConfigAndLLM(
  options: AssistantOptions,
  assistant: Assistant,
) {
  const plugins: PluginObject[] = [
    { name: 'UserConfig', ...options },
    options.llm,
  ];

  const hooksIter = Object.entries(assistant.hooks);

  for (const plugin of plugins) {
    for (const [name, queue] of hooksIter) {
      // @ts-ignore
      const hookItem = plugin[name];

      if (hookItem && typeof hookItem === 'function') {
        queue.add({
          pluginName: plugin.name,
          hook: hookItem.bind(plugin),
        });
      }
    }
  }
}
