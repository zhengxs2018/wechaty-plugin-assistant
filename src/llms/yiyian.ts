import { codeBlock } from 'common-tags';
import { YiYan, YiYanOptions } from 'yiyan-chat';

import { type ChatModel, type ConversationContext } from '../core';
import { PQueue } from '../vendors';

export interface ChatYiYanOptions extends YiYanOptions {
  timeout?: number;
  concurrency?: number;
  interval?: number;
}

export class ChatYiYan implements ChatModel {
  name = 'yiyan-chat';

  human_name = '文心一言';

  api: YiYan;

  limiter: PQueue;

  constructor(options: ChatYiYanOptions) {
    const {
      concurrency = 3,
      interval = 1000,
      timeout = 60 * 1e3,
      ...rest
    } = options;

    this.api = new YiYan(rest);

    this.limiter = new PQueue({
      concurrency,
      interval,
      timeout,
    });
  }

  async call(ctx: ConversationContext) {
    const { message } = ctx;
    const {
      wechaty: { Message },
    } = message;

    if (message.type() !== Message.Type.Text) {
      return ctx.reply(
        codeBlock`
        暂不支持此类型的消息

        -------------------
        以上内容来自 ${this.human_name}，与开发者无关`,
        true,
      );
    }

    const { api, limiter } = this;

    const text = message.text();
    const state = ctx.session?.yiyan ?? {};

    const chat = await limiter.add(
      ({ signal }) => {
        return api.chat.completions.create({
          text: text,
          sessionId: state.sessionId,
          sessionName: state.sessionId ? '' : text,
          parentChatId: state.parentChatId,
          plugins: [YiYan.AiQiCha, YiYan.TreeMind, YiYan.Rethink],
          signal,
        });
      },
      {
        signal: ctx.lock?.controller.signal,
        throwOnTimeout: true,
      },
    );

    if (chat.isBan) {
      delete ctx.session.yiyan;

      return ctx.reply(
        codeBlock`
          ${chat.tokens_all || '内容含有违禁词，请勿发送不良内容'}

          -------------------
          以上内容来自 ${this.human_name}，与开发者无关`,
        true,
      );
    }

    if (chat.needClearHistory) {
      delete ctx.session.yiyan;

      return ctx.reply(
        codeBlock`
        ${chat.tokens_all || '会话已过期，请重新提问'}

        -------------------
        以上内容来自 ${this.human_name}，与开发者无关`,
        true,
      );
    }

    state.sessionId = chat.sessionId;
    state.parentChatId = chat.chat_id;

    if (chat.chatType === 'TEXT2IMG') {
      const parsed = extractImages(chat.tokens_all);

      return ctx.reply(codeBlock`
        ${parsed.images.map(url => `- ${url}`)}

        ${parsed.text}

        提示语: ${text}

        -------------------
        以上内容来自 ${this.human_name}，与开发者无关`);
    }

    if (chat.chatType === 'TTS') {
      return ctx.reply(codeBlock`
      ${chat.content}

      -------------------
      以上内容来自 ${this.human_name}，与开发者无关`);
    }

    if (chat.chatType === 'PLUGIN') {
      try {
        // 说图解画插件返回的字符串...
        const data = JSON.parse(chat.text);

        if (data?.showType === 'download') {
          const { downloadInfo } = data;
          const { endDesc, fileInfo } = downloadInfo;
          const { jumpText, jumpLink, type } = fileInfo;

          if (type === 'jump') {
            return ctx.reply(codeBlock`
              ![图片](${fileInfo.pic})

              ${endDesc}

              ${jumpText}: ${jumpLink}

              -------------------
              以上内容来自 ${this.human_name}，与开发者无关`);
          }

          return ctx.reply(codeBlock`
            ${fileInfo.pic}

            ${endDesc}

            -------------------
            以上内容来自 ${this.human_name}，与开发者无关`);
        }
      } catch {}
    }

    ctx.reply(
      codeBlock`
      ${chat.tokens_all || chat.content}

      -------------------
      以上内容来自 ${this.human_name}，与开发者无关`,
      true,
    );
  }
}

const EXT_IMG_RE = /<\s*img[^>]+src="([^"]+)"/i;

// <img src=\"http://eb118-file.cdn.bcebos.com/upload/27E7315B68D4C0E0B353591C8F256B71?x-bce-process=style/wm_ai\" />
function extractImg(content: string) {
  const match = content.match(EXT_IMG_RE);
  const link = match && match[1];
  return link ? link.replace('?x-bce-process=style/wm_ai', '') : '';
}

/**
 * 提取 AI 生成的图片链接
 */
function extractImages(content: string) {
  const [text, ...chunks] = content.split('<br>').reverse();

  return {
    text: text,
    images: chunks.map(extractImg),
  };
}
