import { AssertionError } from 'node:assert';

import { codeBlock } from 'common-tags';

import { Command } from '../core/commander';
import { DeepL, type DeepLTranslationOptions } from '../integrations';

const api = new DeepL();

const cmd = new Command('deepl', {
  required: true,
  summary: 'DeepL 翻译',
  description: codeBlock`

    支持语言列表：

    ${Array.from(api.supportedLanguages).map(([lang, code]) => {
      return `  ${lang} - ${code}`;
    })}

    输入语言代码，可以手动指定翻译语言，例如：

    /deepl -f zh 你好
    /deepl -f zh -t en 你好
    /deepl -t zh hello

    如果不指定语言代码，会自动检测文本语言，但是这会导致一些特殊语言的翻译出现问题`,
});

cmd.option('from', {
  alias: 'f',
  description: '源语言代码',
});

cmd.option('to', {
  alias: 't',
  description: '目标语言代码',
});

cmd.action(async (ctx, options) => {
  const input = options._.join(' ').trim();

  if (input.length === 0) {
    return ctx.reply(
      codeBlock`
      ⊶ 系统提示
      ﹊
      请输入要翻译的文本`,
      true,
    );
  }
  try {
    const response = await api.translate(
      input,
      options as DeepLTranslationOptions,
    );

    const { result, alternatives = [] } = response;

    if (alternatives.length > 0) {
      return ctx.reply(codeBlock`
      ⊶ 翻译结果
      ﹊
      ${result}

      备选结果：

      ${alternatives.map(text => ` - ${text}`)}`);
    }

    return ctx.reply(codeBlock`
    ⊶ 翻译结果
    ﹊
    ${result}`);
  } catch (err) {
    if (err instanceof AssertionError) {
      return ctx.reply(
        codeBlock`
        ⊶ 系统提示
        ﹊
        ${err.message}`,
        true,
      );
    }

    console.error('deepl', err);

    return ctx.reply(
      codeBlock`
      ⊶ 系统提示
      ﹊
      翻译服务无法使用，稍后再试试吧`,
      true,
    );
  }
});

export default cmd;
