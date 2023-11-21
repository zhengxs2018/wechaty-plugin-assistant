export type MemoryCache<Value = unknown> = {
  /**
   * 读取一条缓存
   *
   * @param key - 缓存的键
   * @returns 缓存的值
   */
  get(key: string): Promise<Value | undefined>;

  /**
   * 写入一条缓存
   *
   * @param key - 缓存的键
   * @param value - 缓存的值
   * @param ttl - 单位为秒
   * @returns 是否写入成功
   */
  set(key: string, value: Value, ttl?: number): Promise<true>;

  /**
   * 删除一条缓存
   * @param key - 缓存的键
   * @returns 是否删除成功
   */
  delete(key: string): Promise<boolean>;

  /**
   * 删除所有条目
   */
  clear(): Promise<void>;
};

export type State = {
  restore: () => Promise<void>;
  clear: () => Promise<void>;
  [key: string]: any;
};
