# 一、概念

使用本项目，你必须理解的概念。

## Keywords 口令

内置功能调用。模拟 web 界面操作，如：新建对话，停止回复。

<img src="./media/demo-keywords.png" width="200">
<img src="./media/demo-help.png" width="200">

口令，也就是关键词触发，可以说是不得以的办法的办法，主要解决：用户无法直接控制助手的行为。

我在研究钉钉的交互卡片，就是为了让用户可以通过交互式卡片控制 AI 的行为，以丰富界面交互的功能。

## Command 指令

二次开发实现的，以 `/` 斜线开始的自定义命令。主要用于增强机器人交互，执行不需要对话请求的功能调用，并且提供类似 CLI 参数解析的功能。

<img src="./media/demo-command-my.png" width="200">
<img src="./media/demo-command-dict.png" width="200">

## Lock 请求锁

因为大模型和人不一样，无法持续接收以及实时交互，主要用于模拟 Web Loading 效果，限制限制用户消息频率，保护大模型不崩溃。

<img src="./media/demo-lock.png" width="200">

## ConversationContext 对话上下文

wechaty 其实是很不错的库，但缺少记录当前用户的状态，以及过程中的数据记录。

对话上下文要做的事情有：

1. 生成唯一对话 ID
2. 判断 **对话用户** 是否是管理员
3. 创建 **对话用户** 个人配置对象
4. 创建 **对话用户** 对话状态 (保持群内与个人唯一)
5. 创建请求锁
6. 快速回复（群聊，提及对方，私聊直接发）
7. 等等一切过程中，可以做的任何事情

## UserConfig 用户配置

这是直接和人挂钩，比如我们支持多个模型切换，张三说 “切换一言”，李四说 “切换星火”，那张三和李四就是不同的大模型。

## Session 对话状态

比如我在群里，我发给 AI 一句话，再发给 AI 一句话，应该要保持当前为同一个对话。

或者我创建一个新对话，那就不能和之前的对话串起来，这就是 对话状态 要做的事情，记录当前对话中的状态数据。

但这不应该属于对话，因为不管这么创建新对话，我都应该是当前切换的模型，这就是用户配置。

## ChatType and InputType 聊天类型和输入类型

不同的 AI 支持的消息类型都不一样，但不会支持微信特有的，如 抢红包 等功能。聊天类型决定了这个大模型，可以接受什么类型的消息。

```ts
import { ChatType, defineLLM } from '@zhengxs/wechaty-plugin-assistant'

const ChatOpenAI = defineLLM({
  name: 'openai',
  human_name: 'ChatGPT',
   // 如果你的模型只能处理文本消息，你的输入类型就是 Text
  input_type: [ChatType.Text],
  ...
})

const ChatOpenAI = defineLLM({
  name: 'openai',
  human_name: 'ChatGPT',
   // 如果你还能接受图片，那就添加 Image
  input_type: [ChatType.Text, ChatType.Image],
  ...
})
```

输入是给 **LLM** 使用的，而 **ChatType** 表示用户发送过来的消息类型，非模型支持的输入类型，将直接被 **助手** 拒绝掉。

## LLM API 大模型接口

不同的模型，接口不一致，可以自己实现，也可以对接开源项目，如 [chatgpt](https://github.com/transitive-bullshit/chatgpt-api) 或我写的 [erniebot](https://github.com/zhengxs2018/erniebot-sdk-for-js)。

但也有可能自己实现或代理了如 openai chat 的，然后自己实现一个调用。

让后提供给 LLM 大模型进行调用。

## LLM 大模型

大模型的目的是调用接收并处理微信消息，并调用大模型提供的 API，然后回复用户。

所以大模型相当于是 助手 和 API 之间的桥梁，让助手可以获得模型回复的能力。
