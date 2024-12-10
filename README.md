# Vercel 版 Telegram 机器人

这是一个部署在 Vercel 上的 Telegram 机器人，可以响应 /start 命令并显示自定义菜单。

## 配置步骤

1. 通过 [@BotFather](https://t.me/botfather) 创建新机器人并获取 token
2. 在 Vercel 中设置环境变量：
   - BOT_TOKEN：您的 Telegram 机器人 token

## 开发说明

1. 安装依赖包：`npm install`
2. 设置 webhook URL：`https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<VERCEL_URL>`

## 部署方法

1. 安装 Vercel CLI：`npm i -g vercel`
2. 部署命令：`vercel`

## 功能说明

- 响应 /start 命令
- 显示自定义菜单键盘
- 支持基本的对话交互
- 部署在 Vercel serverless 环境
