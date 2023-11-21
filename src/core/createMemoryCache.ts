import Keyv from 'keyv';

import { type MemoryCache } from '../interfaces';
import { QuickLRU } from '../vendors';

export function createMemoryCache<Value = unknown>(): MemoryCache<Value> {
  return new Keyv({
    store: new QuickLRU({ maxSize: 10000 }),
  });
}
