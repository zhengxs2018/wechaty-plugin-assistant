import { codeBlock } from 'common-tags';

import { type ConversationContext } from '../interfaces';
import { MultiChatModelSwitch } from '../llms';

export function printHelp(ctx: ConversationContext) {
  const { llm } = ctx;
  const llms = llm instanceof MultiChatModelSwitch ? llm.llms : [llm];

  const commands = Array.from(ctx.assistant.command.commands.values());

  return ctx.reply(
    codeBlock`
    ⊶ 帮助信息
    ﹊

    口令

    ☛ 重新开始
    ☛ 停止
    ☛ 查看模型
    ☛ 切换 <模型名称>
    ☛ 帮助
    ☛ 查看源码

    指令

    ${commands.map(cmd => `  ☛ ${cmd.name}`)}

    模型列表

    ${llms.map(m => `  ☛ ${m.summary || m.human_name}`)}

    如恶意使用，将拉入黑名单，敬请谅解。`,
  );
}
