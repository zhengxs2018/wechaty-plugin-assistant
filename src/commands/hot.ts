// cSpell: ignore zhihuHot bili douyinHot douban
import { codeBlock } from 'common-tags';
import { log } from 'wechaty';

import { Command } from '../integrations/commander';

const hotSiteMap = new Map([
  ['hp', 'huPu'],
  ['zh', 'zhihuHot'],
  ['36', '36Ke'],
  ['bd', 'baiduRD'],
  ['bl', 'bili'],
  ['jt', 'history'],
  ['tb', 'baiduRY'],
  ['wb', 'wbHot'],
  ['dy', 'douyinHot'],
  ['db', 'douban'],
  ['sp', 'ssPai'],
  ['it', 'itInfo'],
  ['itn', 'itNews'],
]);

const cmd = new Command('hot', {
  required: true,
  summary: '热搜',
  description: codeBlock`

  数据来源
    - hp: 虎扑步行街
    - zh: 知乎热榜
    - 36: 36氪
    - bd: 百度热点
    - bl: 哔哩哔哩
    - jt: 历史上的今天
    - tb: 贴吧热议
    - wb: 微博热搜
    - dy: 抖音热点
    - db: 豆瓣小组
    - sp: 少数派
    - it: IT之家
    - itn: IT之家新闻

  输出代号即可，如：/hot hp
  `,
});

type HostSearchItem = {
  title: string;
  pic: string;
  desc: string;
  hot: string;
  url: string;
  mobilUrl: string;
};

type APIResponse = {
  success: boolean;
  message: string;
  title: string;
  subtitle: string;
  update_time: string;
  data: HostSearchItem[];
};

cmd.action(async (ctx, parsedArgs) => {
  const type = hotSiteMap.get(parsedArgs._[0]) || 'wbHot';

  const response: APIResponse | undefined = await fetch(
    `https://api.vvhan.com/api/hotlist?type=${type}`,
  ).then(
    response => {
      if (response.ok) return response.json();

      log.error('热搜服务异常 %d %s', response.status, type);
    },
    error => {
      log.error('error', error);
    },
  );

  if (!response || !response.success) {
    return ctx.reply(
      codeBlock`
      ⊶ 系统提示
      ﹊
      ${response?.message || '热搜服务器暂时无法使用，稍后再试试吧'}`,
      true,
    );
  }

  const [head, ...list] = response.data;

  ctx.reply(
    codeBlock`
    ${response.title}
    ====================

    🔥 ${head.title}
    ${head.desc ? `\n${head.desc}\n` : ''}

    ${list
      .slice(0, 9)
      .map((item, index) => ` ${index + 1}. ${item.title}`)
      .join('\n')}

    更新时间：${response.update_time}
    `,
    true,
  );
});

export default cmd;
