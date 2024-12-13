# Telegram Bot 智能助手项目

## 项目简介

这是一个基于 Vercel 平台开发的 Telegram 机器人项目，集成了实时监控系统和可视化管理面板。项目采用现代化的前端技术栈和 Serverless 架构，提供了稳定可靠的机器人服务和数据分析能力。

## 核心功能

- 智能对话：支持多样化的用户交互和命令处理
- 实时监控：集成完整的消息统计和系统状态监控
- 数据分析：提供详细的用户活动和使用情况分析
- 可视化面板：直观展示运行状态和关键指标
- 日志记录：完整的系统日志和错误追踪
- 多语言支持：内置中英文双语支持

## 技术架构

### 前端技术栈

- React 18
- Recharts 图表库
- Lucide React 图标库
- Webpack 5 构建工具

### 后端技术栈

- Vercel Serverless Functions
- MongoDB 数据存储
- Telegraf.js Bot 框架
- Node.js 运行环境

## 项目结构

```
TELEGRAM-BOT-VERCE/
├── api/                    # Serverless API目录
│   ├── monitoring.js       # 监控系统核心逻辑
│   ├── start.js           # 统计数据API
│   ├── test.js            # 测试接口
│   └── webhook.js         # Telegram webhook处理
├── public/                 # 静态资源目录
│   └── index.html         # 主页模板
├── src/                    # 源代码目录
│   ├── Dashboard.jsx      # 管理面板组件
│   └── index.js           # 应用入口
└── 配置文件
    ├── package.json       # 项目依赖配置
    ├── vercel.json        # Vercel部署配置
    └── webpack.config.js  # Webpack构建配置
```

## 环境要求

- Node.js 16.x 或更高版本
- MongoDB 4.x 或更高版本
- Telegram Bot Token

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
npm install
```

### 2. 配置环境变量

在项目根目录创建`.env`文件：

```
BOT_TOKEN=你的Telegram Bot Token
MONGODB_URI=MongoDB连接字符串
```

### 3. 本地开发

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

### 4. Vercel 部署

```bash
# 安装Vercel CLI
npm install -g vercel

# 部署到Vercel
vercel
```

## Bot 配置步骤

1. 通过 @BotFather 创建新的 Telegram 机器人
2. 获取 Bot Token 并设置到环境变量
3. 设置 Webhook URL：

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<VERCEL_URL>/api/webhook
```

## 监控面板使用说明

管理面板提供以下核心功能：

- 实时状态监控
- 消息统计分析
- 用户活跃度追踪
- 系统日志查看
- 性能指标展示

## 开发指南

### API 接口说明

1. `/api/webhook` - Telegram 消息处理
2. `/api/monitoring` - 监控系统 API
3. `/api/start` - 统计数据 API
4. `/api/test` - 测试接口

### 自定义开发

1. Bot 命令扩展

   - 在`webhook.js`中添加新的命令处理器
   - 使用 Telegraf.js 的中间件机制

2. 监控指标扩展

   - 在`monitoring.js`中添加新的监控逻辑
   - 在 Dashboard 组件中添加对应的展示组件

3. 前端界面定制
   - 修改`Dashboard.jsx`以添加新的可视化组件
   - 使用 Recharts 库创建新的图表

## 注意事项

1. 安全性考虑

   - 请妥善保管 Bot Token
   - 定期检查系统日志
   - 注意 MongoDB 访问权限配置

2. 性能优化

   - 合理使用数据缓存
   - 优化数据库查询
   - 控制 API 请求频率

3. 错误处理
   - 完善的错误日志记录
   - 异常情况及时通知
   - 自动重试机制

## 问题反馈

如遇到问题，请检查：

1. 环境变量配置
2. MongoDB 连接状态
3. Webhook 设置状态
4. 系统日志记录

## 贡献指南

欢迎提交 Issue 和 Pull Request，请确保：

1. 代码符合项目规范
2. 添加必要的测试用例
3. 更新相关文档

## 许可证

MIT License - 详见 LICENSE 文件

## 更新日志

请查看 CHANGELOG.md 了解详细的更新历史。
