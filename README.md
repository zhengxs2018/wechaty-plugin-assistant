<div align="center"><a name="readme-top"></a>
  
<h1>微信智能对话机器人</h1>

使用 wechaty 开发的聊天助手插件，内置多种AI大模型，只需三步即可轻松创建一个智能对话机器人

[![][npm-types-shield]][npm-types-link]
[![][npm-release-shield]][npm-release-link]
[![][npm-downloads-shield]][npm-downloads-link]
[![][github-releasedate-shield]][github-releasedate-link]<br/>
[![][github-contributors-shield]][github-contributors-link]
[![][github-forks-shield]][github-forks-link]
[![][github-stars-shield]][github-stars-link]
[![][github-issues-shield]][github-issues-link]
[![][github-license-shield]][github-license-link]

[Report Bug][github-issues-link] · [Request Feature][github-issues-link]

![](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

</div>

> [!WARNING]
> 发现使用 `Node 20`，在服务器启动会报一堆的 `AssertError` 错误，使用 `Node 18` 较为稳定。
> `AssertError` 错误后，可能出现 **自动重试**，导致可能的 **重复消息** 或 **自动退出**，原因未知

<details>
<summary><kbd>目录树</kbd></summary>

#### TOC

- [✨ 功能特性](#-功能特性)
- [📖 使用文档](#-使用文档)
- [📦 安装](#-安装)
- [🧰 内置功能](#-内置功能)
- [🪢 AI 模型](#-ai-模型)
- [🔗 更多工具](#-更多工具)
- [🤝 参与贡献](#-参与贡献)

<br/>

</details>

## ✨ 功能特性

- 🚀 **快速开始**: 只需简单三步，即可轻松启动智能对话机器人。
- 💡 **关注点分离**: 通过抽象 **助手**、**上下文** 和 **大模型** 的概念，更方便地理解和应用，以应对复杂的对话场景。
- 💬 **用户对话**: 专注于处理用户私聊和群内被提及的消息，避免大模型被大量消息阻塞。
- ⏳ **处理等待**: 如果 AI 尚未回应，自动拒绝新消息的处理，确保对话流畅。
- 🪡 **自由定制**: 考虑到二次开发的需求，可以方便地拓展助手功能，满足个性化需求。

## 📖 使用文档

**教程**

- [一、概念](./docs/concepts.md)
- [二、消息流程处理](./docs/process.md)
- [三、自定义开发](./docs/tutorials.md)

**文章**

- [构建一个属于你自己的 AI 对话机器人](./docs/blog/build-your-ai-assistant.md.md)

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 📦 安装

要安装 `@zhengxs/wechaty-plugin-assistant`，请运行以下命令:

```bash
$ pnpm install @zhengxs/wechaty-plugin-assistant
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 👋 使用

在这里获取你的 [accessToken](https://aistudio.baidu.com/index/accessToken) 值。

```ts
import { ChatERNIEBot, createAssistant } from '@zhengxs/wechaty-plugin-assistant';
import { WechatyBuilder } from 'wechaty';
import { QRCodeTerminal } from 'wechaty-plugin-contrib';

// ============ 第一步：选择大模型  ============

const llm = new ChatERNIEBot({
  token: process.env.EB_ACCESS_TOKEN, // 飞桨平台的 token
});

// ============ 第二步：创建 AI 助手  ============

const assistant = createAssistant({
  llm,
});

// ============ 第三步：启动 wechaty 服务  ============

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

同时接入多个大模型。

```ts
import { ChatERNIEBot, ChatQWen, createAssistant, MultiChatModelSwitch } from '@zhengxs/wechaty-plugin-assistant';

const assistant = createAssistant({
  llm: new MultiChatModelSwitch([
    new ChatERNIEBot(),
    new ChatQWen(),
    // more...
  ]),
});
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🧰 内置功能

### 口令

| 口令                               | 描述                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `新对话` \\ `新聊天` \\ `重新开始` | 模拟 Web UI 的 创建新聊天 功能                                                |
| `停止` \\ `停止回复`               | 模拟 Web UI 的 停止生成 按钮                                                  |
| `查看模型` \\ `切换 xxx`           | `MultiChatModelSwitch` 模块添加的功能，允许配置多个模型，由最终使用者自己切换 |

### 指令

> [!NOTE]
> 后续将去除内置指令，改为按需手动注册。

| 名称     | 描述                                                                                                                          | 状态  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | ----- |
| `/deepl` | DeepL 翻译，感谢 [bob-plugin-akl-deepl-free-translate][bob-plugin-deepl] 提供的代码 以及 [deepL](https://deepl.com/) 提供服务 | Alpha |
| `/dict`  | 汉字解释，感谢 [Pear][pear-api] 提供的 API                                                                                    | Alpha |
| `/hot`   | 热搜榜，感谢 [韩小韩][han-api] 提供的 API                                                                                     | Alpha |
| `/kfc`   | 疯狂星期四文案，感谢 [Brick][brick-api] 提供的 API                                                                            | Alpha |
| `/moyu`  | 摸鱼日历，感谢 [韩小韩][brick-api] 提供的 API 以及 摸鱼日历 提供的图片                                                        | Alpha |

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🪢 AI 模型

目前仅支持官方 API 调用，暂不提供 Web API 的代理。

| 名称                                     | 公司      | 描述                                                                                               | 代码         | 状态  |
| ---------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- | ------------ | ----- |
| 文心一言                                 | 百度      | 支持 [百度千帆][bce-yiyan] 和 [AI Studio][as-yiyan] 的 API 调用                                    | ChatERNIEBot | Alpha |
| [通义千问][ali-qwen]                     | 阿里      | 支持阿里云 [DashScope][aliyun-dashscope-model-list] 的大部分模型，如`qwen` 和 `qwen-vl` 系列的模型 | ChatQWen     | Alpha |
| [混元助手](https://hunyuan.tencent.com/) | 腾讯      |                                                                                                    | ChatHunYuan  | Alpha |
| [星火认知][spark-api]                    | 讯飞      | 支持 `1.5 \| 2 \| 3` 模型                                                                          | ChatSpark    | Alpha |
| [MM智能助理][mm-api]                     | 稀宇科技  | 支持 `abab5-chat \| abab5.5-chat \| abab5.5-chat-pro` 模型                                         | ChatMinimax  | Alpha |
| Claude                                   | Anthropic | 基于 [Claude](https://claude.ai/chats) Web API，内部已配置 [反向代理服务][apifox]                  | ChatClaudeAI | Alpha |
| ChatGPT                                  | OpenAI    | 推荐 [代理][openai-proxy]                                                                          | ChatOpenAI   | Alpha |
| Bard                                     | Google    |                                                                                                    | -            | N/A   |

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## ⌨️ 本地开发

可以使用 GitHub Codespaces 进行在线开发：

[![][github-codespace-shield]][github-codespace-link]

或者使用以下命令进行本地开发：

```bash
$ git clone https://github.com/zhengxs2018/wechaty-plugin-assistant.git
$ cd wechaty-plugin-assistant
$ pnpm install
$ pnpm dev
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🔗 更多工具

- **[🤖 @zhengxs/ai](https://github.com/zhengxs2018/ai)** - 集成 百度文心一言，阿里通义千问，腾讯混元助手 和 讯飞星火认知 等国内大模型的 API，并且适配 OpenAI 的输入与输出。

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🤝 参与贡献

我们非常欢迎各种形式的贡献。如果你对贡献代码感兴趣，可以查看我们的 GitHub [Issues][github-issues-link] 大展身手，向我们展示你的奇思妙想。

[![][pr-welcome-shield]][pr-welcome-link]

[![][github-contrib-shield]][github-contrib-link]

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🕘 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=zhengxs2018/wechaty-plugin-assistant&type=Date)](https://star-history.com/#zhengxs2018/wechaty-plugin-assistant&Date)

<div align="right">

[![][back-to-top]](#readme-top)

</div>

---

#### 📝 License

Copyright © 2023 [zhengxs2018][profile-link]. <br />
This project is [MIT](./LICENSE) licensed.

<div align="right">

[![][back-to-top]](#readme-top)

</div>

[profile-link]: https://github.com/zhengxs2018
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
[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-black?style=flat-square
[aliyun-dashscope-model-list]: https://help.aliyun.com/zh/dashscope/developer-reference/model-square/
[npm-release-shield]: https://img.shields.io/npm/v/@zhengxs/wechaty-plugin-assistant?color=369eff&labelColor=black&logo=npm&logoColor=white&style=flat-square
[npm-release-link]: https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant
[npm-downloads-shield]: https://img.shields.io/npm/dt/@zhengxs/wechaty-plugin-assistant?labelColor=black&style=flat-square
[npm-downloads-link]: https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant
[npm-types-shield]: https://img.shields.io/npm/types/@zhengxs/wechaty-plugin-assistant?labelColor=black&style=flat-square
[npm-types-link]: https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant
[github-issues-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/issues
[pr-welcome-shield]: https://img.shields.io/badge/%F0%9F%A4%AF%20PR%20WELCOME-%E2%86%92-ffcb47?labelColor=black&style=for-the-badge
[pr-welcome-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/pulls
[github-contrib-shield]: https://contrib.rocks/image?repo=zhengxs2018%2Fwechaty-plugin-assistant
[github-contrib-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/graphs/contributors
[github-codespace-shield]: https://github.com/codespaces/badge.svg
[github-codespace-link]: https://codespaces.new/zhengxs2018/wechaty-plugin-assistant
[npm-release-shield]: https://img.shields.io/npm/v/@zhengxs/wechaty-plugin-assistant?color=369eff&labelColor=black&logo=npm&logoColor=white&style=flat-square
[npm-release-link]: https://www.npmjs.com/package/@zhengxs/wechaty-plugin-assistant
[github-releasedate-shield]: https://img.shields.io/github/release-date/zhengxs2018/wechaty-plugin-assistant?labelColor=black&style=flat-square
[github-releasedate-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/releases
[github-contributors-shield]: https://img.shields.io/github/contributors/zhengxs2018/wechaty-plugin-assistant?color=c4f042&labelColor=black&style=flat-square
[github-contributors-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/graphs/contributors
[github-forks-shield]: https://img.shields.io/github/forks/zhengxs2018/wechaty-plugin-assistant?color=8ae8ff&labelColor=black&style=flat-square
[github-forks-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/network/members
[github-stars-shield]: https://img.shields.io/github/stars/zhengxs2018/wechaty-plugin-assistant?color=ffcb47&labelColor=black&style=flat-square
[github-stars-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/network/stargazers
[github-issues-shield]: https://img.shields.io/github/issues/zhengxs2018/wechaty-plugin-assistant?color=ff80eb&labelColor=black&style=flat-square
[github-issues-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/issues
[github-license-shield]: https://img.shields.io/github/license/zhengxs2018/wechaty-plugin-assistant?color=white&labelColor=black&style=flat-square
[github-license-link]: https://github.com/zhengxs2018/wechaty-plugin-assistant/blob/main/LICENSE
