import { codeBlock } from 'common-tags';
import { log } from 'wechaty';

import { Command } from '../core/commander';

const cmd = new Command('dict', {
  required: true,
  summary: '汉字词典',
});

type APIResponse = {
  code: number;
  msg: string;
  data: {
    word: string;
    pinyin: string;
    parse: {
      radical: string;
      strokes: number;
      five_elements: string;
      traditional: string;
      wubi: string;
    };
    mean: string;
    stroke_order: string[];
  };
};

cmd.action(async (ctx, parsedArgs) => {
  const searchString = parsedArgs._[0];

  if (!searchString) {
    return ctx.reply(
      codeBlock`
      ⊶ 系统提示
      ﹊
      请输入要查询的汉字`,
      true,
    );
  }

  const url = new URL('https://api.pearktrue.cn/api/word/parse.php');

  url.searchParams.set('word', searchString);

  const response: APIResponse | undefined = await fetch(url).then(
    response => {
      if (response.ok) {
        return response.json();
      }

      log.error('词典服务异常 %d %s', response.status, word);
    },
    error => {
      log.error('error', error);
    },
  );

  if (!response || response.code !== 200) {
    return ctx.reply(
      codeBlock`
      ⊶ 系统提示
      ﹊
      ${response?.msg || '词典服务无法使用，稍后再试试吧'}`,
      true,
    );
  }

  const { word, pinyin, mean, parse } = response.data;

  const items = [
    word,
    pinyin ? ` - 拼音：${pinyin}` : '',
    parse.wubi ? ` - 五笔：${parse.wubi}` : '',
    parse.radical ? ` - 部首：${parse.radical}` : '',
    parse.five_elements ? ` - 五行：${parse.five_elements}` : '',
    parse.strokes ? ` - 笔画：${parse.strokes}` : '',
  ].filter(Boolean);

  ctx.reply(
    codeBlock`
    汉字词典
    ====================
    ${items.join('\n')}

    解 义
    ﹊
    ${mean || '暂无解释'}`,
    true,
  );
});

export default cmd;
