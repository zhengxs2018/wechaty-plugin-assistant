// @ts-nocheck
// fork https://github.com/transitive-bullshit/chatgpt-api
import { randomUUID } from 'node:crypto';

import { createParser } from 'eventsource-parser';
import { getEncoding } from 'js-tiktoken';
import Keyv from 'keyv';

import { QuickLRU } from '../vendors';

const tokenizer = getEncoding('cl100k_base');

export class APIError extends Error {}

export interface AIStudioAPIOptions {
  cookie: string;
  concurrency?: number;
  interval?: number;
}

export class AIStudioAPI {
  _cookie;
  _apiBaseUrl;
  _appId;
  _debug;

  _completionParams;
  _maxModelTokens;
  _maxResponseTokens;
  _fetch;

  _getMessageById;
  _upsertMessage;

  _messageStore;

  constructor(opts) {
    const {
      cookie,
      appId = 1566,
      apiBaseUrl = 'https://aistudio.baidu.com/llm/lmapi',
      debug = false,
      messageStore,
      completionParams,
      maxModelTokens = 4000,
      maxResponseTokens = 1000,
      getMessageById,
      upsertMessage,
      fetch = globalThis.fetch,
    } = opts;

    this._cookie = cookie;
    this._appId = appId;
    this._apiBaseUrl = apiBaseUrl;
    this._debug = !!debug;
    this._fetch = fetch;

    this._completionParams = {
      temperature: 0.8,
      top_p: 1.0,
      ...completionParams,
    };

    this._maxModelTokens = maxModelTokens;
    this._maxResponseTokens = maxResponseTokens;

    this._getMessageById = getMessageById ?? this._defaultGetMessageById;
    this._upsertMessage = upsertMessage ?? this._defaultUpsertMessage;

    if (messageStore) {
      this._messageStore = messageStore;
    } else {
      this._messageStore = new Keyv({
        store: new QuickLRU({ maxSize: 10000, maxAge: 35 * 60 * 1e3 }),
      });
    }

    if (!this._cookie) {
      throw new Error('百度飞浆 missing required cookie');
    }

    if (!this._fetch) {
      throw new Error('Invalid environment; fetch is not defined');
    }

    if (typeof this._fetch !== 'function') {
      throw new Error('Invalid "fetch" is not a function');
    }
  }

  /**
   * Sends a message to the 百度飞浆 chat completions endpoint, waits for the response
   * to resolve, and returns the response.
   *
   * If you want your response to have historical context, you must provide a valid `parentMessageId`.
   *
   * If you want to receive a stream of partial responses, use `opts.onProgress`.
   *
   * @returns The response from AIStudio
   */
  async sendMessage(text, opts = {}) {
    const {
      conversationId = randomUUID(),
      parentMessageId,
      messageId = randomUUID(),
      abortSignal,
      onProgress,
      stream = onProgress ? true : false,
      completionParams,
    } = opts;

    const message = {
      role: 2,
      id: messageId,
      conversationId,
      parentMessageId,
      text,
    };

    const latestQuestion = message;

    const { messages, numTokens } = await this._buildMessages(text, opts);

    const result = {
      role: 2,
      id: randomUUID(),
      conversationId,
      parentMessageId: messageId,
      text: '',
    };

    const responseP = new Promise(async (resolve, reject) => {
      const url = `${this._apiBaseUrl}/chat/${
        stream ? 'stream/' : ''
      }completions`;
      const headers = {
        'Content-Type': 'application/json',
        cookie: this._cookie,
      };
      const body = {
        appId: this._appId,
        ...this._completionParams,
        ...completionParams,
        messages,
        sessionKey: conversationId,
      };

      if (this._debug) {
        console.log(`sendMessage (${numTokens} tokens)`, body);
      }

      if (stream) {
        fetchSSE(
          url,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: abortSignal,
            // TODO 支持 onProgress 方法
            onMessage: data => {
              try {
                const response = JSON.parse(data);

                if (response.id) {
                  result.id = response.id;
                }

                result.text = response.content;

                if (response.role) {
                  result.role = response.role;
                }

                result.detail = response;
                resolve(result);
              } catch (err) {
                console.warn('百度飞浆 stream SEE event unexpected error', err);
                return reject(err);
              }
            },
          },
          this._fetch,
        ).catch(reject);
      } else {
        try {
          const res = await this._fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: abortSignal,
          });

          if (!res.ok) {
            const reason = await res.text();
            const msg = `百度飞浆 error ${
              res.status || res.statusText
            }: ${reason}`;
            const error = new APIError(msg, { cause: res });
            error.statusCode = res.status;
            error.statusText = res.statusText;
            return reject(error);
          }

          const json = await res.json();
          if (this._debug) {
            console.log(json);
          }

          const { result: message, errorCode, errorMsg } = json;

          if (errorCode !== 0) {
            return reject(
              new APIError(`百度飞浆 error: ${errorMsg} (${errorCode})`),
            );
          }

          if (result?.id) {
            result.id = message.id;
          }

          result.text = message.content;
          if (message.role) {
            result.role = message.role;
          }

          result.detail = message;

          return resolve(result);
        } catch (err) {
          return reject(err);
        }
      }
    }).then(async message => {
      if (message.detail && !message.detail.usage) {
        try {
          const promptTokens = numTokens;
          const completionTokens = await this._getTokenCount(message.text);
          message.detail.usage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
            estimated: true,
          };
        } catch (err) {
          // TODO: this should really never happen, but if it does,
          // we should handle notify the user gracefully
        }
      }

      return Promise.all([
        this._upsertMessage(latestQuestion),
        this._upsertMessage(message),
      ]).then(() => message);
    });

    return responseP;
  }

  get token() {
    return this._token;
  }

  set token(token) {
    this._token = token;
  }

  get appId() {
    return this._appId;
  }

  set appId(appId) {
    this._appId = appId;
  }

  async _buildMessages(text, opts) {
    let { parentMessageId } = opts;

    const userLabel = 'User';
    const assistantLabel = 'Assistant';

    const maxNumTokens = this._maxModelTokens - this._maxResponseTokens;
    let messages = [];

    let nextMessages = text
      ? messages.concat([
          {
            role: 2,
            content: text,
            // name: opts.name
          },
        ])
      : messages;
    let numTokens = 0;

    do {
      const prompt = nextMessages
        .reduce((prompt, message) => {
          switch (message.role) {
            case 1:
              return prompt.concat([`${userLabel}:\n${message.content}`]);
            default:
              return prompt.concat([`${assistantLabel}:\n${message.content}`]);
          }
        }, [])
        .join('\n\n');

      const nextNumTokensEstimate = await this._getTokenCount(prompt);
      const isValidPrompt = nextNumTokensEstimate <= maxNumTokens;

      if (prompt && !isValidPrompt) {
        break;
      }

      messages = nextMessages;
      numTokens = nextNumTokensEstimate;

      if (!isValidPrompt) {
        break;
      }

      if (!parentMessageId) {
        break;
      }

      const parentMessage = await this._getMessageById(parentMessageId);
      if (!parentMessage) {
        break;
      }

      const parentMessageRole = parentMessage.role || 2;

      nextMessages = [
        {
          role: parentMessageRole,
          content: parentMessage.text,
          // name: parentMessage.name
        },
        ...nextMessages,
      ];

      parentMessageId = parentMessage.parentMessageId;
    } while (true);

    // Use up to 4096 tokens (prompt + response), but try to leave 1000 tokens
    // for the response.
    const maxTokens = Math.max(
      1,
      Math.min(this._maxModelTokens - numTokens, this._maxResponseTokens),
    );

    return { messages, maxTokens, numTokens };
  }

  async _getTokenCount(text) {
    // TODO: use a better fix in the tokenizer
    text = text.replace(/<\|endoftext\|>/g, '');

    return new Uint32Array(tokenizer.encode(text)).length;
  }

  async _defaultGetMessageById(id) {
    const res = await this._messageStore.get(id);
    return res;
  }

  async _defaultUpsertMessage(message) {
    await this._messageStore.set(message.id, message);
  }
}

async function fetchSSE(url, options, fetch = globalThis.fetch) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    let reason;

    try {
      reason = await res.text();
    } catch (err) {
      reason = res.statusText;
    }

    const msg = `百度飞浆 error ${res.status}: ${reason}`;
    const error = new APIError(msg, { cause: res });
    error.statusCode = res.status;
    error.statusText = res.statusText;
    throw error;
  }

  const parser = createParser(event => {
    if (event.type === 'event' && event.event === 'message') {
      onMessage(event.data);
    }
  });

  if (!res.body.getReader) {
    // Vercel polyfills `fetch` with `node-fetch`, which doesn't conform to
    // web standards, so this is a workaround...
    const body = res.body;

    if (!body.on || !body.read) {
      throw new APIError('unsupported "fetch" implementation');
    }

    body.on('readable', () => {
      let chunk;
      while (null !== (chunk = body.read())) {
        parser.feed(chunk.toString());
      }
    });
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      const str = new TextDecoder().decode(chunk);
      parser.feed(str);
    }
  }
}

export async function* streamAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
