import { type MemoryCache, type State } from '../interfaces';

export async function createConversationSession(
  cache: MemoryCache,
  conversationId: string,
): Promise<State> {
  const key = `assistant:session:${conversationId}`;

  const state = ((await cache.get(key)) || {}) as State;

  const restore = async () => {
    await cache.set(key, state);
  };

  const clear = async () => {
    // hack 避免被 restore 重新存储回去
    for (const key in state) {
      delete state[key];
    }
    await cache.delete(key);
  };

  Object.defineProperties(state, {
    clear: {
      configurable: false,
      enumerable: false,
      writable: false,
      value: clear,
    },
    restore: {
      configurable: false,
      enumerable: false,
      writable: false,
      value: restore,
    },
  });

  return state;
}
