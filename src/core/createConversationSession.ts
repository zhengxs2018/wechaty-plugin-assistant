import { type MemoryCache } from './createMemoryCache';

export type ConversationSession = {
  restore: () => Promise<void>;
  clear: () => Promise<void>;

  [key: string]: any;
};

export async function createConversationSession(
  cache: MemoryCache,
  conversationId: string,
): Promise<ConversationSession> {
  const key = `assistant:session:${conversationId}`;

  const state = (await cache.get(key)) || {};

  const restore = async () => {
    await cache.set(key, state);
  };

  const clear = async () => {
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

  return state as ConversationSession;
}
