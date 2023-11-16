import { Queue, RunFunction } from './queue';

interface TimeoutOptions {
  /**
	Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
	*/
  timeout?: number;

  /**
	Whether or not a timeout is considered an exception.

	@defaultValue false
	*/
  throwOnTimeout?: boolean;
}

export interface Options<
  QueueType extends Queue<RunFunction, QueueOptions>,
  QueueOptions extends QueueAddOptions,
> extends TimeoutOptions {
  /**
	Concurrency limit.

	Minimum: `1`.

	@defaultValue Infinity
	*/
  readonly concurrency?: number;

  /**
	Whether queue tasks within concurrency limit, are auto-executed as soon as they're added.

	@defaultValue true
	*/
  readonly autoStart?: boolean;

  /**
	Class with a `enqueue` and `dequeue` method, and a `size` getter. See the [Custom QueueClass](https://github.com/sindresorhus/p-queue#custom-queueclass) section.
	*/
  readonly queueClass?: new () => QueueType;

  /**
	The max number of runs in the given interval of time.

	Minimum: `1`.

	@defaultValue Infinity
	*/
  readonly intervalCap?: number;

  /**
	The length of time in milliseconds before the interval count resets. Must be finite.

	Minimum: `0`.

	@defaultValue 0
	*/
  readonly interval?: number;

  /**
	Whether the task must finish in the given interval or will be carried over into the next interval count.

	@defaultValue false
	*/
  readonly carryoverConcurrencyCount?: boolean;
}

export interface QueueAddOptions extends TaskOptions, TimeoutOptions {
  /**
	Priority of operation. Operations with greater priority will be scheduled first.

	@defaultValue 0
	*/
  readonly priority?: number;
}

export interface TaskOptions {
  /**
	[`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for cancellation of the operation. When aborted, it will be removed from the queue and the `queue.add()` call will reject with an `AbortError`. If the operation is already running, the signal will need to be handled by the operation itself.
	*/
  readonly signal?: AbortSignal;
}
