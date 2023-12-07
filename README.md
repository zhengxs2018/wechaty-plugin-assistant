# @zhengxs/wechaty-plugin-assistant

[![Typescript](https://img.shields.io/badge/lang-typescript-informational?style=flat-square)](https://www.typescriptlang.org)[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)[![npm package](https://img.shields.io/npm/v/@zhengxs/wechaty-plugin-assistant.svg?style=flat-square)](https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant)[![npm downloads](https://img.shields.io/npm/dt/@zhengxs/wechaty-plugin-assistant.svg?style=flat-square)](https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant)![License](https://img.shields.io/npm/l/@zhengxs/wechaty-plugin-assistant.svg?style=flat-square)

基于 wechaty 的聊天助手插件。

> 非稳定状态，请勿用于生产环境

## 功能特性

- 排除群内非提及自身的消息
- 排除私聊非个人（如：微信团队）消息
- 支持自定义大模型接入
- 对二次开发友好

## 文档

**教程**

- [一、概念](./docs/concepts.md)
- [二、消息流程处理](./docs/process.md)
- [三、自定义开发](./docs/tutorials.md)

**文章**

- [构建一个属于你自己的 AI 对话机器人](./docs/blog/build-your-ai-assistant.md.md)

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

## 内置指令

| 名称     | 描述                                                                                                                          | 状态  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | ----- |
| `/deepl` | DeepL 翻译，感谢 [bob-plugin-akl-deepl-free-translate][bob-plugin-deepl] 提供的代码 以及 [deepL](https://deepl.com/) 提供服务 | Alpha |
| `/dict`  | 汉字解释，感谢 [Pear][pear-api] 提供的 API                                                                                    | Alpha |
| `/hot`   | 热搜榜，感谢 [韩小韩][han-api] 提供的 API                                                                                     | Alpha |
| `/kfc`   | 疯狂星期四文案，感谢 [Brick][brick-api] 提供的 API                                                                            | Alpha |
| `/moyu`  | 摸鱼日历，感谢 [韩小韩][brick-api] 提供的 API 以及 摸鱼日历 提供的图片                                                        | Alpha |

## 模型支持

| 名称                                     | 公司      | 描述                                                                              | 代码         | 状态  |
| ---------------------------------------- | --------- | --------------------------------------------------------------------------------- | ------------ | ----- |
| 文心一言                                 | 百度      | 支持 [百度千帆][bce-yiyan] 和 [AI Studio][as-yiyan] 的 API 调用                   | ChatERNIEBot | Alpha |
| [通义千问][ali-qwen]                     | 阿里      | 支持 `qwen-turbo \| qwen-plus \| qwen-max \| baichuan2-7b-chat-v1` 模型           | ChatQWen     | Alpha |
| [混元助手](https://hunyuan.tencent.com/) | 腾讯      |                                                                                   | ChatHunYuan  | Alpha |
| [星火认知][spark-api]                    | 讯飞      | 支持 `1.5 \| 2 \| 3` 模型                                                         | ChatSpark    | Alpha |
| [MM智能助理][mm-api]                     | 稀宇科技  | 支持 `abab5-chat \| abab5.5-chat \| abab5.5-chat-pro` 模型                        | ChatMinimax  | Alpha |
| Claude                                   | Anthropic | 基于 [Claude](https://claude.ai/chats) Web API，内部已配置 [反向代理服务][apifox] | ChatClaudeAI | Alpha |
| ChatGPT                                  | OpenAI    | 推荐 [代理][openai-proxy]                                                         | ChatOpenAI   | Alpha |
| Bard                                     | Google    |                                                                                   | -            | N/A   |

目前仅支持官方 API 调用。

## 本地开发

你应该使用 `node.js >= 18` 和 `pnpm` 运行本项目。

```sh
# 安装依赖
$ pnpm install

# 启动服务
$ pnpm dev

# 执行目标文件代码，task 后面跟文件地址
$ pnpm task ./samples/llm/custom.ts
```

## 待办清单

### 助手拓展

- [ ] 畅聊
  - 功能：模拟富文本功能，用户可以随意发送，只有触发口令，才会讲所有内容提交给 AI
  - 口令：`开始畅聊`，`退出畅聊`，`请回答|解释一下｜到你了`
- [ ] 定时消息发送
  - 功能：允许用户或助手订阅并发送消息
  - 口令：`取消任务 xxx`，`查看所有任务`
- [ ] 群管理
  - 功能：如果自身是管理员，支持踢出和同意加入
  - 功能：允许管理员启用或修改 新人入群 提示
  - 难点：获取群管理员列表
- [ ] 群统计
  - 功能：统计群成员昵称，生成词云，并发送
  - 功能：统计每日消息数量，每日8点发送群统计，并发送

### 微信功能

- [ ] 特殊消息
  - 类型：`Message.Type.Unknown`
  - 功能：拍一拍，语音通话，视频通话
  - 回复：消息将转为文字发送给 AI
- [ ] 表情消息
  - 类型：`Message.Type.Emoticon`
  - 功能：提供表情下载和搜索功能，由模型决定是调用 表情搜索 还是 图片解析 服务
  - 难点：这么下载表情图片
  - 回复：纯提示
- [ ] 分享卡片
  - 类型： `Message.Type.Url`
  - 功能：文章分享，音乐分享
  - 回复：提取内容后，转发给 AI 处理
- [ ] 消息撤回
  - 类型：`Message.Type.Recalled`
  - 回复：提示对方，如有隐私担忧找开发者沟通
- [ ] 新人入群：
  - 事件：`room-join`
  - 动作：发送欢迎消息
- [ ] 邀请入群
  - 事件：`room-invite`
  - 动作：Web 版不支持，发送不支持消息

## 关联项目

- [@zhengxs/ai](https://github.com/zhengxs2018/ai) - 各平台大模型 API 统一封装
- [@zhengxs/erniebot](https://github.com/zhengxs2018/erniebot-sdk-for-js)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=zhengxs2018/wechaty-plugin-assistant&type=Date)](https://star-history.com/#zhengxs2018/wechaty-plugin-assistant&Date)

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
[bob-plugin-deepl]: https://github.com/akl7777777/bob-plugin-akl-deepl-free-translate
[pear-api]: https://api.pearktrue.cn/
[han-api]: https://api.vvhan.com/
[brick-api]: https://api.001500.cn/
[as-yiyan]: https://aistudio.baidu.com/cooperate/yiyan
[bce-yiyan]: https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html
[ali-qwen]: https://help.aliyun.com/zh/dashscope/developer-reference/tongyi-thousand-questions/
[spark-api]: https://xinghuo.xfyun.cn/sparkapi
[mm-api]: https://api.minimax.chat/
