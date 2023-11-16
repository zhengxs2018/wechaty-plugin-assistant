import { codeBlock } from 'common-tags';
import minimist from 'minimist';

import { type Assistant } from './createAssistant';
import { type ConversationContext } from './createConversationContext';

export interface OptionParams {
  alias?: string;
  type?: 'string' | 'boolean';
  description?: string;
}

export class Option {
  name: string;

  alias?: string | undefined;

  type?: 'string' | 'boolean' | undefined;

  description: string | undefined;

  assistant!: Assistant;

  constructor(name: string, opts: OptionParams = {}) {
    this.name = name;
    this.alias = opts.alias;
    this.type = opts.type;
    this.description = opts.description || '';
  }

  toString() {
    const chunks = [];

    if (this.alias) {
      chunks.push(`-${this.alias}, --${this.name}`);
    } else {
      chunks.push(`--${this.name}`);
    }

    if (this.type) {
      chunks.push(`[${this.type}]`);
    }

    if (this.description) {
      chunks.push(this.description);
    }

    return chunks.join().trim();
  }
}

export interface CommandOptions {
  summary?: string | undefined;

  description?: string | undefined;

  required?: boolean;

  disabled?: boolean;

  raw?: boolean;

  default?: boolean;
}

export type ActionHandler = (
  ctx: ConversationContext,
  args: minimist.ParsedArgs & { raw: string[] },
) => Promise<unknown> | unknown;

export class Command {
  /**
   * 命令名称
   */
  name: string;

  /**
   * 是否需要输入项
   */
  required: boolean;

  /**
   * 是否禁用
   */
  disabled?: boolean;

  /**
   * 是否默认命令
   */
  default?: boolean;

  /**
   * 父级指令
   */
  parent?: Command;

  /**
   * 介绍
   */
  #summary?: string;

  /**
   * 配置项
   */
  #options = new Map<string, Option>();

  /**
   * 子命令
   */
  #commands = new Map<string, Command>();

  /**
   * 处理器
   */
  #actionHandler?: ActionHandler;

  /**
   * 帮助配置
   */
  #helpOption: Option;

  constructor(name: string, options: CommandOptions = {}) {
    this.name = name;

    this.#summary = options.summary || '';
    this.required = options.required === true;
    this.disabled = options.disabled === true;
    this.default = options.default === true;

    this.#helpOption = new Option('help', {
      type: 'boolean',
      alias: 'H',
      description: '帮助',
    });
  }

  summary(): string | undefined;
  summary(summary: string): Command;
  summary(summary?: string): string | Command | undefined {
    if (summary) {
      this.#summary = summary;
      return this;
    }

    return this.#summary;
  }

  usage() {
    const commands: string[] = [];

    this.#commands.forEach(cmd => {
      if (cmd.disabled) return;

      const summary = cmd.summary();

      if (summary) {
        commands.push(`  - ${cmd.name} ${summary}`);
      } else {
        commands.push(`  - ${cmd.name}`);
      }
    });

    // 根提示
    if (!this.parent) {
      if (commands.length) {
        return codeBlock`
        ${this.summary() || '使用说明'}

        Commands:

        ${commands.join('\n')}`;
      }

      return `暂无可用的有效指令！`;
    }

    const options: string[] = [];

    this.#options.forEach(opt => {
      options.push(opt.toString());
    });

    const chunks = [
      codeBlock`
      使用说明

      Usage: /${this.name} [options]${this.required ? ' <input>' : ''}`,
    ];

    if (this.#summary) {
      chunks.push(this.#summary);
    }

    if (options.length) {
      chunks.push(codeBlock`
      Options:

      ${options.join('\n')}`);
    }

    if (commands.length) {
      chunks.push(codeBlock`
      Commands:

      ${commands.join('\n')}`);
    }

    return chunks.join('\n\n');
  }

  addCommand(command: Command) {
    command.parent = this;

    this.#commands.set(command.name, command);

    return this;
  }

  /**
   * @param name - 命令名称
   * @param options - 命令配置
   */
  add(cmd: Command): Command;
  add(name: string, options?: CommandOptions): Command;
  add(cmd: string | Command, options?: CommandOptions): Command {
    const command = cmd instanceof Command ? cmd : new Command(cmd, options);
    this.addCommand(command);
    return command;
  }

  /**
   * @param name - 命令名称
   * @param options - 命令配置
   */
  register(name: string, action: ActionHandler): Command;
  register(
    name: string,
    options: CommandOptions,
    action: ActionHandler,
  ): Command;
  register(name: string, ...args: unknown[]): Command {
    let command: Command;
    if (typeof args[0] === 'function') {
      command = new Command(name);
      command.action(args[0] as ActionHandler);
    } else {
      command = new Command(name, args[0] as CommandOptions);
      command.action(args[1] as ActionHandler);
    }

    this.addCommand(command);
    return command;
  }

  /**
   * @param name - 参数名
   * @param opts - 参数
   */
  option(name: string, opts?: OptionParams) {
    this.#options.set(name, new Option(name, opts));
    return this;
  }

  /**
   * @param  argv - 原始参数
   * @returns 解析好的参数
   */
  protected parseArgs(argv: string[]): minimist.ParsedArgs & { raw: string[] } {
    const config = {
      boolean: [] as string[],
      string: [] as string[],
      alias: {} as Record<string, string>,
    };

    const options = [...this.#options.values(), this.#helpOption];

    options.forEach(opt => {
      const alias = opt.alias;
      if (alias) {
        config.alias[alias] = opt.name;
      }

      // @ts-ignore
      const list = config[opt.type];
      if (Array.isArray(list)) {
        list.push(opt.name);
      }
    });

    const parsed = minimist(argv, config);
    return { ...parsed, raw: argv };
  }

  /**
   * @param handler - 处理函数
   * @returns
   */
  async action(handler: ActionHandler) {
    this.#actionHandler = handler;
    return this;
  }

  /**
   * @param argv - 原始参数
   * @param params - 回应参数
   * @example
   *
   * ```sh
   * $ /mj --help
   * ```
   */
  parse(ctx: ConversationContext, argv: string[]): Promise<void> | void {
    const commands = this.#commands;

    // 判断是否子命令
    if (commands.size > 0) {
      const [cmd, ...chunks] = argv;

      // /mj or mj
      let existing = cmd.startsWith('/')
        ? commands.get(cmd.slice(1))
        : commands.get(cmd);

      if (!existing) {
        commands.forEach(cmd => {
          if (cmd.default) existing = cmd;
        });
      }

      if (existing) return existing.parse(ctx, chunks);
    }

    const parsedArgs = this.parseArgs(argv);
    if (!parsedArgs.help && this.#actionHandler) {
      this.#actionHandler(ctx, parsedArgs);
      return;
    }

    return ctx.reply(this.usage());
  }
}
