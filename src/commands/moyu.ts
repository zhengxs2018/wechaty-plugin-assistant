import { codeBlock } from 'common-tags';

import { Command } from '../core/commander';

const cmd = new Command('my', {
  summary: '摸鱼日历',
});

cmd.action(ctx => {
  fetch('https://api.vvhan.com/api/moyu').then(response => {
    if (response.ok) {
      console.log(response.url);
      ctx.sendFileFromUrl(response.url);
    } else {
      ctx.reply(
        codeBlock`
        ⊶ 系统提示
        ﹊
        服务器出错了，稍后再试试吧`,
        true,
      );
    }
  });
});

export default cmd;
