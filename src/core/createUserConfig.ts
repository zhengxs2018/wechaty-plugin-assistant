import { type MemoryCache, State } from '../interfaces';

export async function createUserConfig(
  cache: MemoryCache,
  talkerId: string,
  talkerName: string,
): Promise<State> {
  const key = `user:config:${talkerId}`;

  const state = ((await cache.get(key)) || {}) as State;

  // 方便管理和查看配置对象
  state.user_name = talkerName;

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
