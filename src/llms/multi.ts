import { codeBlock } from 'common-tags';

import { Assistant, type ChatModel, type ConversationContext } from '../core';

export class MultiChatModelSwitch implements ChatModel {
  /**
   * 名称
   */
  name: string = 'multi-model';

  /**
   * 人类可读名称
   */
  human_name: string = '多模型管理';

  llms: Map<string, ChatModel> = new Map();

  defaultLLM?: ChatModel;

  constructor(llms: ChatModel[]) {
    this.defaultLLM = llms[0];
    this.llms = new Map(llms.map(llm => [llm.name, llm]));
  }

  getLLM(name?: string): ChatModel | undefined {
    if (!name) return this.defaultLLM;

    return this.llms.get(name) || this.defaultLLM;
  }

  async call(ctx: ConversationContext, assistant: Assistant) {
    const { message } = ctx;

    const {
      wechaty: { Message },
    } = message;

    // TODO 类型转为字符串，移动到 core 中
    if (message.type() === Message.Type.Text) {
      return this.processText(ctx, assistant);
    }

    return this.calling(ctx, assistant);
  }

  async calling(ctx: ConversationContext, assistant: Assistant) {
    const {
      userConfig: { model },
    } = ctx;

    const llm = this.getLLM(model);

    await llm?.call(ctx, assistant);
  }

  findLLMModel(searchName: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, llm] of this.llms) {
      console.log(llm.name, llm.human_name, searchName);

      if (
        llm.name.toLowerCase().includes(searchName) ||
        llm.human_name.toLowerCase().includes(searchName)
      ) {
        return llm;
      }
    }
  }

  processText(ctx: ConversationContext, assistant: Assistant) {
    const text = ctx.message.text();

    if (text === '查看模型') {
      const llm = this.getLLM(ctx.userConfig.model);

      return ctx.reply(codeBlock`
      系统提示
      ===================

      当前模型: ${llm?.human_name} | 暂无可用模型。

      模型列表

      ${Array.from(this.llms.values())
        .map(llm => `  - ${llm.human_name}`)
        .join(`\n`)}`);
    }

    if (text.startsWith('切换')) {
      const searchName = text.split('切换')[1]?.trim();
      if (!searchName) {
        return ctx.reply(codeBlock`
          系统提示
          ===================

          模型列表

          ${Array.from(this.llms.values())
            .map(llm => `  - ${llm.human_name}`)
            .join(`\n`)}`);
      }

      const found = this.findLLMModel(searchName.toString());

      if (found) {
        ctx.userConfig.model = found.name;

        return ctx.reply(codeBlock`
        系统提示
        ===================

        已切换至 ${found.human_name}`);
      }

      return ctx.reply(codeBlock`
      系统提示
      ===================

      需要切换至的模型不存在或不可用，请选择其他模型。

      模型列表

      ${Array.from(this.llms.values())
        .map(llm => `  - ${llm.human_name}`)
        .join(`\n`)}`);
    }

    return this.calling(ctx, assistant);
  }
}
