// from vuepress plugin Api
import type {
  HookItem,
  HookQueue,
  HooksName,
  HooksResult,
} from '../interfaces';

export const createAssistantHookQueue = <T extends HooksName>(
  name: T,
): HookQueue<T> => {
  const items: HookItem<T>[] = [];

  const hookQueue: HookQueue<T> = {
    name,
    items,
    add: item => {
      items.push(item);
    },
    process: async (controller, ...args) => {
      const results: HooksResult[T][] = [];

      for (const item of items) {
        if (controller.signal.aborted) break;

        try {
          // process and get the result of the the hook item
          const result = (await item.hook(
            controller,
            // @ts-expect-error: the types could not be narrowed correctly
            ...args,
          )) as HooksResult[T];

          // push the result to results array
          if (result !== undefined) {
            results.push(result);
          }
        } catch (e) {
          console.error(`error in hook ${name} from ${item.pluginName}`);
        }
      }

      return results;
    },
  };

  return hookQueue;
};
