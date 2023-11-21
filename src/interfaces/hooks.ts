import { Message } from 'wechaty';

import type { Assistant } from './assistant';
import type { ConversationContext } from './context';
import type { MaybePromise } from './typescript';

// base hook type
export interface Hook<
  Exposed,
  Normalized = Exposed,
  Result = Normalized extends (...args: any) => infer U
    ? U extends Promise<infer V>
      ? V
      : U
    : void,
> {
  exposed: Exposed;
  normalized: Normalized;
  result: Result;
}

export type LifeCycleHook<T extends unknown[] = []> = Hook<
  (
    controller: AbortController,
    assistant: Assistant,
    ...args: T
  ) => MaybePromise<void>
>;

export type ExtendsHook<T> = Hook<
  (
    controller: AbortController,
    extendable: T,
    assistant: Assistant,
  ) => MaybePromise<void>
>;

/**
 * List of hooks
 */
export interface Hooks {
  /**
   * 消息接收
   */
  onMessage: LifeCycleHook<[Message]>;

  /**
   * 私人消息
   */
  onIndividualMessage: LifeCycleHook<[Message]>;

  /**
   * 房间消息
   */
  onRoomMessage: LifeCycleHook<[Message]>;

  /**
   * 在房间被提及
   */
  onRoomMentionSelfMessage: LifeCycleHook<[Message]>;

  /**
   * 上下文创建后
   */
  onContextCreated: ExtendsHook<ConversationContext>;

  /**
   * 上下文销毁后
   */
  onContextDestroyed: ExtendsHook<ConversationContext>;

  /**
   * 处理文本消息
   */
  onPrepareTextMessage: ExtendsHook<ConversationContext>;
}

/**
 * Name of hooks
 */
export type HooksName = keyof Hooks;

/**
 * Exposed hooks API that can be accessed by a plugin
 */
export type HooksExposed = {
  [K in HooksName]: Hooks[K]['exposed'];
};

/**
 * Normalized hooks
 */
export type HooksNormalized = {
  [K in HooksName]: Hooks[K]['normalized'];
};

/**
 * Result of hooks
 */
export type HooksResult = {
  [K in HooksName]: Hooks[K]['result'];
};

/**
 * Hook item
 */
export interface HookItem<T extends HooksName> {
  // the name of the plugin who introduce this hook
  pluginName: string;
  // the normalized hook
  hook: HooksNormalized[T];
}

/**
 * Hook items queue
 */
export interface HookQueue<T extends HooksName> {
  name: T;
  items: HookItem<T>[];
  add: (item: HookItem<T>) => void;
  process: (
    ...args: Parameters<HooksNormalized[T]>
  ) => Promise<HooksResult[T][]>;
}
