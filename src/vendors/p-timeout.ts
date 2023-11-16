export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
An error to be thrown when the request is aborted by AbortController.
DOMException is thrown instead of this Error when DOMException is available.
*/
export class AbortError extends Error {
  constructor(message: string) {
    super();
    this.name = 'AbortError';
    this.message = message;
  }
}

/**
TODO: Remove AbortError and just throw DOMException when targeting Node 18.
*/
const getDOMException = (errorMessage: string) =>
  globalThis.DOMException === undefined
    ? new AbortError(errorMessage)
    : new DOMException(errorMessage);

/**
TODO: Remove below function and just 'reject(signal.reason)' when targeting Node 18.
*/
const getAbortedReason = (signal?: AbortSignal) => {
  const reason =
    // @ts-ignore
    signal.reason === undefined
      ? getDOMException('This operation was aborted.')
      : // @ts-ignore
        signal.reason;

  return reason instanceof Error ? reason : getDOMException(reason);
};

// @ts-ignore
export function pTimeout(promise, options) {
  const {
    milliseconds,
    fallback,
    message,
    customTimers = { setTimeout, clearTimeout },
  } = options;

  // @ts-ignore
  let timer;

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

    // @ts-ignore
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

        if (typeof promise.cancel === 'function') {
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

  return cancelablePromise;
}
