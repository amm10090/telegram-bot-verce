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
  TELEGRAM-BOT-VERCE/ # 项目根目录
  ├── api/ # API 文件夹，包含 Vercel Serverless 函数
  │ ├── test.js # 测试接口文件
  │ └── webhook.js # Telegram webhook 处理程序
  │
  ├── node_modules/ # Node.js 依赖包目录
  │ └── ... # 项目依赖的各个模块
  │
  ├── public/ # 静态文件目录
  │ └── index.html # 管理面板前端页面
  │
  ├── .gitignore # Git 忽略文件配置
  ├── package-lock.json # 依赖版本锁定文件
  ├── package.json # 项目配置和依赖管理
  ├── README.md # 项目说明文档
  └── vercel.json # Vercel 部署配置文件
