import { codeBlock } from 'common-tags';
import { log } from 'wechaty';

import { Command } from '../integrations/commander';

const cmd = new Command('kfc', {
  required: true,
  summary: '疯狂星期四',
});

type APIResponse = {
  code: number;
  text: string;
  data: {
    msg: string;
  };
};

cmd.action(async ctx => {
  const response: APIResponse | undefined = await fetch(
    'https://api.001500.cn/API/kfc.php?type=json',
  ).then(
    response => {
      if (response.ok) {
        return response.json();
      }

      log.error('疯狂星期四 %d %s', response.status);
    },
    error => {
      log.error('error', error);
    },
  );

  if (response && response.data) {
    return ctx.reply(response.data.msg);
  }

  console.error('疯狂星期四 error', response);

  return ctx.reply(
    codeBlock`
    ⊶ 系统提示
    ﹊
    星期四文学暂时无法使用，稍后再试试吧`,
    true,
  );
});

export default cmd;
