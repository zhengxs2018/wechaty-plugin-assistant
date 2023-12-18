import { codeBlock } from 'common-tags';

import {
  Assistant,
  type ChatModel,
  ChatType,
  type ConversationContext,
} from '../interfaces';

export class MultiChatModelSwitch implements ChatModel {
  name: string = 'multi-model';
  human_name: string = '多模型管理';
  input_type: ChatType[] = [];
  llms: ChatModel[];

  protected llmMap: Map<string, ChatModel> = new Map();
  protected llm?: ChatModel;

  constructor(llms: ChatModel[]) {
    this.llm = llms[0];
    this.llms = llms;
    this.llmMap = new Map(llms.map(llm => [llm.name, llm]));
    this.input_type = Array.from(
      new Set(llms.map(llm => llm.input_type).flat()),
    );
  }

  onPrepareTextMessage(controller: AbortController, ctx: ConversationContext) {
    const { message, userConfig } = ctx;
    const text = message.text();

    if (text === '查看模型') {
      const llm = this.resolve(userConfig.model);

      // 中断后续处理
      controller.abort();

      return ctx.reply(codeBlock`
      ⊶ 系统提示
      ﹊
      当前模型: ${llm?.human_name || '暂无可用模型'}。

      模型列表
      ${Array.from(this.llms.values())
          .map(llm => `  - ${llm.human_name}`)
          .join(`\n`)}

      输入 “切换${llm?.human_name || '模型名称'
        }”，可以切换至其他模型，模型名称支持模糊匹配。
      -------------------
      输入 "帮助" 获取更详细的使用说明。`);
    }

    if (text.startsWith('切换')) {
      // 中断后续处理
      controller.abort();

      // Note: 如果这里阻止，reply 将不会发送任何消息
      // 需要想办法让 reply 发送消息
      // ctx.abort();

      const searchName = text.split('切换')[1]?.toLowerCase().trim();

      if (!searchName) {
        return ctx.reply(codeBlock`
          ⊶ 系统提示
          ﹊
          模型列表
          ${Array.from(this.llms.values())
            .map(llm => `  - ${llm.human_name}`)
            .join(`\n`)}

          提示：必须带 “切换” 关键字，但模型名称支持模糊匹配。
          -------------------
          输入 "帮助" 获取更详细的使用说明。`);
      }

      const found = this.find(searchName.toString());

      if (found) {
        userConfig.model = found.name;


        // 输出招呼语
        if (found.greeting) {
          return ctx.reply(found.greeting);
        }

        return ctx.reply(codeBlock`
        ⊶ 系统提示
        ﹊
        已切换至 ${found.human_name}`);
      }

      return ctx.reply(codeBlock`
      ⊶ 系统提示
      ﹊
      需要切换至的模型不存在或不可用，请选择其他模型。

      模型列表
      ${Array.from(this.llms.values())
          .map(llm => `  - ${llm.human_name}`)
          .join(`\n`)}

      提示：必须带 “切换” 关键字，但模型名称支持模糊匹配。
      -------------------
      输入 "帮助" 获取更详细的使用说明。`);
    }
  }

  async call(ctx: ConversationContext, assistant: Assistant) {
    const llm = this.resolve(ctx.userConfig.model);

    if (!llm) {
      return ctx.reply(codeBlock`
      ⊶ 系统提示
      ﹊
      暂无可用的 AI 模型！
      -------------------
      输入 "帮助" 获取更详细的使用说明。`);
    }

    if (llm.input_type.includes(ctx.type) === false) {
      ctx.reply(codeBlock`
      ⊶ 系统提示
      ﹊
      ${llm.human_name} 暂不支持处理此类消息！

      请切换至其他模型后再试。
      -------------------
      输入 "帮助" 获取更详细的使用说明。`);
    }

    // 如果当前模型调用失败，尝试其他模型
    const llms = this.llms.filter(cur => {
      return cur.input_type.includes(ctx.type) && llm !== cur;
    });

    return this.calling(ctx, assistant, llm, llms);
  }

  async calling(
    ctx: ConversationContext,
    assistant: Assistant,
    llm: ChatModel,
    llms: ChatModel[] = this.llms,
  ) {
    try {
      return await llm.call(ctx, assistant);
    } catch (error) {
      console.error(`${llm.human_name} 模型调用失败`, error);

      if (llms.length > 0) {
        ctx.reply(codeBlock`
        ⊶ 系统提示
        ﹊
        ${llm.human_name} 模型调用失败，将尝试其他模型。`);

        return this.callWithFallback(ctx, assistant, llms);
      }

      ctx.reply(codeBlock`
      ⊶ 系统提示
      ﹊
      ${llm.human_name} 模型调用失败，可以试试其他模型。
      -------------------
      输入 "帮助" 获取更详细的使用说明。`);
    }
  }

  async callWithFallback(
    ctx: ConversationContext,
    assistant: Assistant,
    llms: ChatModel[] = this.llms,
  ): Promise<void> {
    const llm = llms.shift();
    try {
      return await llm?.call(ctx, assistant);
    } catch (error) {
      if (llms.length > 0) {
        return await this.callWithFallback(ctx, assistant, llms);
      }
      throw error;
    }
  }

  protected resolve(name?: string): ChatModel | undefined {
    if (!name) return this.llm;
    return this.llmMap.get(name) || this.llm;
  }

  protected find(searchName: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const llm of this.llms) {
      if (
        llm.name.toLowerCase().includes(searchName) ||
        llm.human_name.toLowerCase().includes(searchName)
      ) {
        return llm;
      }
    }
  }
}
