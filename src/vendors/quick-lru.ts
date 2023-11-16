// See https://github.com/sindresorhus/quick-lru/blob/main/index.js

export type Options<KeyType, ValueType> = {
  /**
	The maximum number of milliseconds an item should remain in the cache.

	@defaultValue Infinity

	By default, `maxAge` will be `Infinity`, which means that items will never expire.
	Lazy expiration upon the next write or read call.

	Individual expiration of an item can be specified by the `set(key, value, maxAge)` method.
	*/
  maxAge?: number;

  /**
	The maximum number of items before evicting the least recently used items.
	*/
  maxSize: number;

  /**
	Called right before an item is evicted from the cache.

	Useful for side effects or for items like object URLs that need explicit cleanup (`revokeObjectURL`).
	*/
  onEviction?: (key: KeyType, value: ValueType) => void;
};

export type CacheValue<ValueType> = {
  value: ValueType;
  expiry?: number;
};

export class QuickLRU<KeyType, ValueType>
  extends Map<KeyType, ValueType>
  implements Iterable<[KeyType, ValueType]>
{
  #size = 0;

  #cache = new Map<KeyType, CacheValue<ValueType>>();

  #oldCache = new Map<KeyType, CacheValue<ValueType>>();

  #maxSize: number;

  #maxAge: number;

  /**
	Called right before an item is evicted from the cache.

	Useful for side effects or for items like object URLs that need explicit cleanup (`revokeObjectURL`).
	*/
  #onEviction?: (key: KeyType, value: ValueType) => void;

  /**
    Simple ["Least Recently Used" (LRU) cache](https://en.m.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29).

    The instance is an [`Iterable`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Iteration_protocols) of `[key, value]` pairs so you can use it directly in a [`for…of`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/for...of) loop.
    */
  constructor(options: Options<KeyType, ValueType>) {
    super();

    if (!(options.maxSize && options.maxSize > 0)) {
      throw new TypeError('`maxSize` must be a number greater than 0');
    }

    if (typeof options.maxAge === 'number' && options.maxAge === 0) {
      throw new TypeError('`maxAge` must be a number greater than 0');
    }

    this.#maxSize = options.maxSize;
    this.#maxAge = options.maxAge || Number.POSITIVE_INFINITY;
    this.#onEviction = options.onEviction;
  }

  // For tests.
  get __oldCache() {
    return this.#oldCache;
  }

  #emitEvictions(cache: Iterable<[KeyType, CacheValue<ValueType>]>) {
    if (typeof this.#onEviction !== 'function') {
      return;
    }

    for (const [key, item] of cache) {
      this.#onEviction(key, item.value);
    }
  }

  #deleteIfExpired(key: KeyType, item: CacheValue<ValueType>) {
    if (typeof item.expiry === 'number' && item.expiry <= Date.now()) {
      if (typeof this.#onEviction === 'function') {
        this.#onEviction(key, item.value);
      }

      return this.delete(key);
    }

    return false;
  }

  #getOrDeleteIfExpired(key: KeyType, item: CacheValue<ValueType>) {
    const deleted = this.#deleteIfExpired(key, item);
    if (deleted === false) {
      return item.value;
    }
  }

  #getItemValue(key: KeyType, item: CacheValue<ValueType>) {
    return item.expiry ? this.#getOrDeleteIfExpired(key, item) : item.value;
  }

  #peek(key: KeyType, cache: Map<KeyType, CacheValue<ValueType>>) {
    const item = cache.get(key)!;

    return this.#getItemValue(key, item);
  }

  #set(key: KeyType, value: CacheValue<ValueType>) {
    this.#cache.set(key, value);
    this.#size++;

    if (this.#size >= this.#maxSize) {
      this.#size = 0;
      this.#emitEvictions(this.#oldCache);
      this.#oldCache = this.#cache;
      this.#cache = new Map();
    }
  }

  #moveToRecent(key: KeyType, item: CacheValue<ValueType>) {
    this.#oldCache.delete(key);
    this.#set(key, item);
  }

  *#entriesAscending() {
    for (const item of this.#oldCache) {
      const [key, value] = item;
      if (!this.#cache.has(key)) {
        const deleted = this.#deleteIfExpired(key, value);
        if (deleted === false) {
          yield item;
        }
      }
    }

    for (const item of this.#cache) {
      const [key, value] = item;
      const deleted = this.#deleteIfExpired(key, value);
      if (deleted === false) {
        yield item;
      }
    }
  }

  /**
	Get an item.

	@returns The stored item or `undefined`.
	*/
  get(key: KeyType): ValueType | undefined {
    if (this.#cache.has(key)) {
      const item = this.#cache.get(key)!;
      return this.#getItemValue(key, item);
    }

    if (this.#oldCache.has(key)) {
      const item = this.#oldCache.get(key)!;
      if (this.#deleteIfExpired(key, item) === false) {
        this.#moveToRecent(key, item);
        return item.value;
      }
    }
  }

  /**
	Set an item. Returns the instance.

	Individual expiration of an item can be specified with the `maxAge` option. If not specified, the global `maxAge` value will be used in case it is specified in the constructor, otherwise the item will never expire.

	@returns The list instance.
	*/
  set(key: KeyType, value: ValueType, options: { maxAge?: number } = {}): this {
    const { maxAge = this.#maxAge } = options;

    const expiry =
      typeof maxAge === 'number' && maxAge !== Number.POSITIVE_INFINITY
        ? Date.now() + maxAge
        : undefined;

    if (this.#cache.has(key)) {
      this.#cache.set(key, {
        value,
        expiry,
      });
    } else {
      this.#set(key, { value, expiry });
    }

    return this;
  }

  has(key: KeyType) {
    if (this.#cache.has(key)) {
      return !this.#deleteIfExpired(key, this.#cache.get(key)!);
    }

    if (this.#oldCache.has(key)) {
      return !this.#deleteIfExpired(key, this.#oldCache.get(key)!);
    }

    return false;
  }

  peek(key: KeyType) {
    if (this.#cache.has(key)) {
      return this.#peek(key, this.#cache);
    }

    if (this.#oldCache.has(key)) {
      return this.#peek(key, this.#oldCache);
    }
  }

  delete(key: KeyType) {
    const deleted = this.#cache.delete(key);
    if (deleted) {
      this.#size--;
    }

    return this.#oldCache.delete(key) || deleted;
  }

  clear() {
    this.#cache.clear();
    this.#oldCache.clear();
    this.#size = 0;
  }

  /**
	Update the `maxSize` in-place, discarding items as necessary. Insertion order is mostly preserved, though this is not a strong guarantee.

	Useful for on-the-fly tuning of cache sizes in live systems.
	*/
  resize(newSize: number): void {
    if (!(newSize && newSize > 0)) {
      throw new TypeError('`maxSize` must be a number greater than 0');
    }

    const items = [...this.#entriesAscending()];
    const removeCount = items.length - newSize;
    if (removeCount < 0) {
      this.#cache = new Map(items);
      this.#oldCache = new Map();
      this.#size = items.length;
    } else {
      if (removeCount > 0) {
        this.#emitEvictions(items.slice(0, removeCount));
      }

      this.#oldCache = new Map(items.slice(removeCount));
      this.#cache = new Map();
      this.#size = 0;
    }

    this.#maxSize = newSize;
  }

  /**
	Iterable for all the keys.
	*/
  *keys(): IterableIterator<KeyType> {
    for (const [key] of this) {
      yield key;
    }
  }

  /**
	Iterable for all the values.
	*/
  *values(): IterableIterator<ValueType> {
    for (const [, value] of this) {
      yield value;
    }
  }

  *[Symbol.iterator](): IterableIterator<[KeyType, ValueType]> {
    for (const item of this.#cache) {
      const [key, value] = item;
      const deleted = this.#deleteIfExpired(key, value);
      if (deleted === false) {
        yield [key, value.value];
      }
    }

    for (const item of this.#oldCache) {
      const [key, value] = item;
      if (!this.#cache.has(key)) {
        const deleted = this.#deleteIfExpired(key, value);
        if (deleted === false) {
          yield [key, value.value];
        }
      }
    }
  }

  /**
	Iterable for all entries, starting with the newest (descending in recency).
	*/
  *entriesDescending(): IterableIterator<[KeyType, ValueType]> {
    let items = [...this.#cache];
    for (let i = items.length - 1; i >= 0; --i) {
      const item = items[i];
      const [key, value] = item;
      const deleted = this.#deleteIfExpired(key, value);
      if (deleted === false) {
        yield [key, value.value];
      }
    }

    items = [...this.#oldCache];
    for (let i = items.length - 1; i >= 0; --i) {
      const item = items[i];
      const [key, value] = item;
      if (!this.#cache.has(key)) {
        const deleted = this.#deleteIfExpired(key, value);
        if (deleted === false) {
          yield [key, value.value];
        }
      }
    }
  }

  /**
	Iterable for all entries, starting with the oldest (ascending in recency).
	*/
  *entriesAscending(): IterableIterator<[KeyType, ValueType]> {
    for (const [key, value] of this.#entriesAscending()) {
      yield [key, value.value];
    }
  }

  get size() {
    if (!this.#size) {
      return this.#oldCache.size;
    }

    let oldCacheSize = 0;
    for (const key of this.#oldCache.keys()) {
      if (!this.#cache.has(key)) {
        oldCacheSize++;
      }
    }

    return Math.min(this.#size + oldCacheSize, this.#maxSize);
  }

  get maxSize() {
    return this.#maxSize;
  }

  entries() {
    return this.entriesAscending();
  }

  forEach(
    callbackFunction: (value: ValueType, key: KeyType, thisArg: this) => void,
    thisArgument = this,
  ) {
    for (const [key, value] of this.entriesAscending()) {
      callbackFunction.call(thisArgument, value, key, this);
    }
  }

  get [Symbol.toStringTag]() {
    return JSON.stringify([...this.entriesAscending()]);
  }
}
