import { createParser } from 'eventsource-parser';

import { streamAsyncIterable } from './stream-async-iterable';
import * as types from './types';

export async function fetchSSE(
  url: string,
  options: Parameters<typeof fetch>[1] & {
    onMessage: (data: string) => void;
    onError?: (error: any) => void;
  },
  fetch: types.FetchFn = globalThis.fetch,
) {
  const { onMessage, onError, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    let reason: string;

    try {
      reason = await res.text();
    } catch (err) {
      reason = res.statusText;
    }

    const msg = `ChatGPT error ${res.status}: ${reason}`;
    const error = new types.ChatGPTError(msg, { cause: res });
    error.statusCode = res.status;
    error.statusText = res.statusText;
    throw error;
  }

  const parser = createParser(event => {
    if (event.type === 'event') {
      onMessage(event.data);
    }
  });

  // handle special response errors
  const feed = (chunk: string) => {
    let response = null;

    try {
      response = JSON.parse(chunk);
    } catch {
      // ignore
    }

    if (response?.detail?.type === 'invalid_request_error') {
      const msg = `ChatGPT error ${response.detail.message}: ${response.detail.code} (${response.detail.type})`;
      const error = new types.ChatGPTError(msg, { cause: response });
      error.statusCode = response.detail.code;
      error.statusText = response.detail.message;

      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }

      // don't feed to the event parser
      return;
    }

    parser.feed(chunk);
  };

  for await (const chunk of streamAsyncIterable(res.body!)) {
    const str = new TextDecoder().decode(chunk);
    feed(str);
  }
}
