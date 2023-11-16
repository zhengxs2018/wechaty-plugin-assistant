export class TimeoutError extends Error {
  readonly name = 'TimeoutError';

  constructor(message?: string) {
    super(message);
  }
}

/**
An error to be thrown when the request is aborted by AbortController.
DOMException is thrown instead of this Error when DOMException is available.
*/
export class AbortError extends Error {
  readonly name = 'TimeoutError';

  constructor(message?: string) {
    super(message);
  }
}

/**
TODO: Remove AbortError and just throw DOMException when targeting Node 18.
*/
const getDOMException = (errorMessage?: string) =>
  globalThis.DOMException === undefined
    ? new AbortError(errorMessage)
    : new DOMException(errorMessage);

/**
TODO: Remove below function and just 'reject(signal.reason)' when targeting Node 18.
*/
const getAbortedReason = (signal: AbortSignal) => {
  const reason =
    signal.reason === undefined
      ? getDOMException('This operation was aborted.')
      : signal.reason;

  return reason instanceof Error ? reason : getDOMException(reason);
};

export type Options<ReturnType> = {
  /**
	Milliseconds before timing out.

	Passing `Infinity` will cause it to never time out.
	*/
  milliseconds: number;

  /**
	Do something other than rejecting with an error on timeout.
	*/
  fallback?: () => ReturnType | Promise<ReturnType>;

  /**
	Specify a custom error message or error to throw when it times out:

	- `message: 'too slow'` will throw `TimeoutError('too slow')`
	- `message: new MyCustomError('it’s over 9000')` will throw the same error instance
	- `message: false` will make the promise resolve with `undefined` instead of rejecting

	If you do a custom error, it's recommended to sub-class `TimeoutError`:
	*/
  message?: string | Error | false;

  /**
	Custom implementations for the `setTimeout` and `clearTimeout` functions.

	Useful for testing purposes, in particular to work around [`sinon.useFakeTimers()`](https://sinonjs.org/releases/latest/fake-timers/).
	*/
  readonly customTimers?: {
    setTimeout: typeof globalThis.setTimeout;
    clearTimeout: typeof globalThis.clearTimeout;
  };

  /**
	You can abort the promise using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

	_Requires Node.js 16 or later._
	*/
  signal?: globalThis.AbortSignal;
};

export type ClearablePromise<T> = {
  /**
	Clear the timeout.
	*/
  clear: () => void;
} & Promise<T>;

/**
Timeout a promise after a specified amount of time.

If you pass in a cancelable promise, specifically a promise with a `.cancel()` method, that method will be called when the `pTimeout` promise times out.

@param input - Promise to decorate.
@returns A decorated `input` that times out after `milliseconds` time. It has a `.clear()` method that clears the timeout.

@example
```
import {setTimeout} from 'node:timers/promises';
import pTimeout from 'p-timeout';

const delayedPromise = () => setTimeout(200);

await pTimeout(delayedPromise(), {
	milliseconds: 50,
	fallback: () => {
		return pTimeout(delayedPromise(), {milliseconds: 300});
	}
});
```
*/
export default function pTimeout<ValueType, ReturnType = ValueType>(
  promise: PromiseLike<ValueType>,
  options: Options<ReturnType> & { message: false },
): ClearablePromise<ValueType | ReturnType | undefined>;
export default function pTimeout<ValueType, ReturnType = ValueType>(
  promise: PromiseLike<ValueType>,
  options: Options<ReturnType>,
): ClearablePromise<ValueType | ReturnType> {
  const {
    milliseconds,
    fallback,
    message,
    customTimers = { setTimeout, clearTimeout },
  } = options;

  let timer: NodeJS.Timer | undefined;

  const wrappedPromise = new Promise((resolve, reject) => {
    if (typeof milliseconds !== 'number' || Math.sign(milliseconds) !== 1) {
      throw new TypeError(
        `Expected \`milliseconds\` to be a positive number, got \`${milliseconds}\``,
      );
    }

    if (options.signal) {
      const { signal } = options;
      if (signal.aborted) {
        reject(getAbortedReason(signal));
      }

      signal.addEventListener('abort', () => {
        reject(getAbortedReason(signal));
      });
    }

    if (milliseconds === Number.POSITIVE_INFINITY) {
      promise.then(resolve, reject);
      return;
    }

    // We create the error outside of `setTimeout` to preserve the stack trace.
    const timeoutError = new TimeoutError();

    timer = customTimers.setTimeout.call(
      undefined,
      () => {
        if (fallback) {
          try {
            resolve(fallback());
          } catch (error) {
            reject(error);
          }

          return;
        }

        // @ts-ignore
        if (typeof promise.cancel === 'function') {
          // @ts-ignore
          promise.cancel();
        }

        if (message === false) {
          // @ts-ignore
          resolve();
        } else if (message instanceof Error) {
          reject(message);
        } else {
          timeoutError.message =
            message ?? `Promise timed out after ${milliseconds} milliseconds`;
          reject(timeoutError);
        }
      },
      milliseconds,
    );
    (async () => {
      try {
        resolve(await promise);
      } catch (error) {
        reject(error);
      }
    })();
  });

  const cancelablePromise = wrappedPromise.finally(() => {
    // @ts-ignore
    cancelablePromise.clear();
  });

  // @ts-ignore
  cancelablePromise.clear = () => {
    // @ts-ignore
    customTimers.clearTimeout.call(undefined, timer);
    timer = undefined;
  };

  // @ts-ignore
  return cancelablePromise;
}
