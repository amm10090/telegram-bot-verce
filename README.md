markdown

# Telegram Bot 项目

这是一个基于 **Telegram Bot API** 开发的 Telegram 机器人，支持简单的指令响应和功能扩展。通过 **Vercel** 部署，使用 **Node.js** 作为后端，采用 **Webhook** 模式接收 Telegram 消息。

## 功能

- 支持 `/start` 命令，欢迎用户。
- 使用 **Vercel** 无服务器平台进行托管，自动扩展。
- 使用 **node-telegram-bot-api** 库与 Telegram 进行交互。

## 部署说明

该项目使用 **Vercel** 部署，具体步骤如下：

### 1. 创建 Telegram Bot

首先，使用 **BotFather** 创建一个新的 Telegram Bot，并获取到 Bot Token。

1. 打开 Telegram，搜索 **BotFather**。
2. 输入 `/newbot` 创建新 Bot，按照提示设置 Bot 的名称和用户名。
3. 获取 Bot Token，保存下来，稍后在项目中使用。

### 2. 准备本地开发环境

本地环境需要安装以下工具：

- **Node.js** 和 **npm**（推荐使用最新稳定版本）
- **Git**（用于版本控制）

### 3. 克隆项目

首先，克隆该项目到本地：

git clone https://github.com/your-username/telegram-bot-vercel.git
cd telegram-bot-vercel 4. 安装依赖
使用 npm 或 yarn 安装项目依赖：

npm install
或者，如果你使用的是 Yarn：

yarn install 5. 配置环境变量
在 Vercel 上部署时，使用以下环境变量配置你的 Bot Token：

打开 Vercel 仪表板，选择你的项目。
转到 Settings > Environment Variables，添加名为 BOT_TOKEN 的环境变量，并将你的 Bot Token 作为值。 6. 配置 Webhook
部署完成后，需要将你的 Vercel 项目 URL 设置为 Telegram Bot 的 Webhook：

获取你部署后的 URL，例如 https://your-bot.vercel.app/api/bot。
使用以下命令设置 Webhook：
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" -d "url=https://your-bot.vercel.app/api/bot" 7. 部署到 Vercel
将代码推送到 GitHub 后，Vercel 会自动部署你的项目。

在 Vercel 中连接你的 GitHub 仓库。
完成部署后，Vercel 会提供一个 URL，你可以通过该 URL 访问 Bot。
.gitignore 配置
为了避免将不必要的文件提交到 Git 仓库，请确保在 .gitignore 中包含以下内容：

# 忽略 node_modules 文件夹

node_modules/
移除 node_modules 文件夹
如果你之前已经将 node_modules 提交到了 Git 仓库，请运行以下命令来移除它：

git rm -r --cached node_modules
git commit -m "Remove node_modules and add to .gitignore"
git push origin main
贡献
欢迎提出问题和贡献代码，任何建议或反馈都可以通过 GitHub Issue 或 Pull Request 进行提交。

License
该项目使用 MIT License 进行许可。

---

## 说明

这个 `README.md` 文件包含了项目的基本信息、部署步骤、配置环境变量以及如何设置 Webhook 的说明。你可以根据需要扩展功能和细节部分。特别是，里面的 **Vercel 部署** 和 **Webhook 配置** 部分，可以确保你的 Bot 部署流程清晰且无缝。

---

_“一个优秀的 `README.md`，是项目成功部署的敲门砖。”_ – Intellectual.AI ✨

如果你需要进一步定制化或添加其他功能说明，请告诉我！ 🌐
