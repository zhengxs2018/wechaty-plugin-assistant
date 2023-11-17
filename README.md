# @zhengxs/wechaty-plugin-assistant

[![Typescript](https://img.shields.io/badge/lang-typescript-informational?style=flat-square)](https://www.typescriptlang.org)[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)[![npm package](https://img.shields.io/npm/v/@zhengxs/wechaty-plugin-assistant.svg?style=flat-square)](https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant)[![npm downloads](https://img.shields.io/npm/dt/@zhengxs/wechaty-plugin-assistant.svg?style=flat-square)](https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant)![License](https://img.shields.io/npm/l/@zhengxs/wechaty-plugin-assistant.svg?style=flat-square)

基于 wechaty 的聊天助手插件。

> 非稳定状态，请勿用于生产环境

## 功能特性

- 排除非私聊或非提及自身的消息
- 支持外部大模型，方便自定义
- 对二次开发友好

## 快速开始

### 安装

```sh
# With NPM
$ npm i -S @zhengxs/wechaty-plugin-assistant

# With Yarn
$ yarn add @zhengxs/wechaty-plugin-assistant

# With PNPM
$ pnpm add @zhengxs/wechaty-plugin-assistant
```

### 使用

```ts
import {
  ChatERNIEBot,
  createAssistant,
} from '@zhengxs/wechaty-plugin-assistant';
import { WechatyBuilder } from 'wechaty';
import { QRCodeTerminal } from 'wechaty-plugin-contrib';

// ============ 创建 AI 助手  ============

const llm = new ChatERNIEBot({
  // 百度文心千帆的 token
  token: process.env.EB_ACCESS_TOKEN,
});

const assistant = createAssistant({
  llm,
});

// ============ 启动 wechaty 服务  ============

const bot = WechatyBuilder.build({
  name: 'demo',
  puppet: 'wechaty-puppet-wechat4u',
  puppetOptions: { uos: true },
});

bot.use(QRCodeTerminal({ small: true }));

// 作为插件使用
bot.use(assistant.callback());

bot.start();
```

## 口令支持

| 口令                               | 描述                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `新对话` \\ `新聊天` \\ `重新开始` | 模拟 Web UI 的，创建新聊天功能                                                |
| `停止` \\ `停止回复`               | 模拟 Web UI 的，停止生成按钮                                                  |
| `查看模型` \\ `切换 xxx`           | `MultiChatModelSwitch` 模块添加的功能，允许配置多个模型，由最终使用者自己切换 |

## 模型支持

| 名称        | 描述                                                                              | 模式          | 状态  |
| ----------- | --------------------------------------------------------------------------------- | ------------- | ----- |
| 文心一言    | 支持 百度千帆 和 AI Studio 的 API 调用                                            | API           | Alpha |
| 通义千问    |                                                                                   | -             | N/A   |
| 讯飞星火    |                                                                                   | -             | N/A   |
| Claude      | 基于 [Claude](https://claude.ai/chats) Web API，内部已配置 [反向代理服务][apifox] | Reverse Proxy | Alpha |
| ChatGPT     | 推荐 [代理][openai-proxy]                                                         | API           | Alpha |
| Google Bard |                                                                                   | -             | N/A   |
| More...     |                                                                                   | -             | N/A   |

## 使用教程

[文档](./docs/tutorials.md)

## 感谢

- [chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api)
- [commander](https://github.com/tj/commander.js)
- [wechaty](https://github.com/wechaty/wechaty)
- [koa.js](https://github.com/koajs/koa)
- [koa-session](https://github.com/koajs/session)
- [vitepress](https://github.com/vuejs/vitepress)
- [openai-proxy](https://github.com/UNICKCHENG/openai-proxy)
- And more

以上排名不分先后

## License

MIT

[apifox]: https://openai-proxy.apifox.cn/
[openai-proxy]: https://www.openai-proxy.com/
