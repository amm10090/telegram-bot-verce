# Telegram Bot 项目

这是一个基于 Python 开发并部署在 Vercel 平台上的 Telegram 机器人项目。该机器人提供了基础的菜单交互功能，可以方便地进行功能扩展。

## 功能特点

本项目具有以下主要特点：

- 基于 `python-telegram-bot` 库开发
- 支持自定义键盘菜单
- 使用 FastAPI 框架处理 webhook 请求
- 完全异步处理，性能优异
- 支持 Vercel 平台一键部署
- 包含前端展示页面

## 技术栈

- 后端框架：FastAPI
- Bot 开发库：python-telegram-bot 20.7
- 部署平台：Vercel
- 前端部署：静态文件托管

## 项目结构

```
project/
├── main.py              # 主程序文件
├── requirements.txt     # 项目依赖
├── vercel.json         # Vercel 配置文件
└── public/             # 前端静态文件
    ├── index.html      # 主页面
    ├── css/           # 样式文件
    ├── js/            # JavaScript 文件
    └── assets/        # 资源文件
```

## 安装部署

1. **环境准备**

   首先确保您已经安装了 Python 3.9 或更高版本，并准备好 Vercel 账号。

2. **获取 Telegram Bot Token**

   通过 Telegram 的 @BotFather 创建新的机器人，并获取 API Token。

3. **配置环境变量**

   在 Vercel 项目设置中添加以下环境变量：

   - `TELEGRAM_BOT_TOKEN`：您的 Bot Token

4. **部署步骤**

   ```bash
   # 克隆项目
   git clone <项目地址>
   cd <项目目录>

   # 安装依赖
   pip install -r requirements.txt

   # 本地测试（可选）
   python main.py

   # Vercel 部署
   vercel
   ```

5. **设置 Webhook**

   部署完成后，需要设置 Webhook URL：

   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_VERCEL_URL>/webhook
   ```

## 使用说明

1. 在 Telegram 中搜索您的机器人用户名
2. 发送 `/start` 命令开始使用
3. 使用显示的菜单按钮进行交互

## 自定义开发

如果您想要扩展机器人的功能，可以：

1. 在 `main.py` 中添加新的命令处理器
2. 修改 `MENU_KEYBOARD` 添加新的菜单选项
3. 实现新的回调函数处理用户交互
4. 在 public 目录下修改前端页面

## 注意事项

- 确保环境变量配置正确
- Webhook URL 必须使用 HTTPS
- 定期检查 Bot Token 的有效性
- 注意遵守 Telegram Bot API 的使用限制

## 故障排除

如果遇到以下问题：

1. **Webhook 设置失败**

   - 检查 URL 是否正确
   - 确认 HTTPS 证书有效

2. **机器人无响应**
   - 检查 Token 是否正确
   - 查看 Vercel 日志输出

## 贡献指南

欢迎提交 Pull Request 来改进这个项目。在提交之前，请确保：

1. 代码符合 PEP 8 规范
2. 添加必要的测试用例
3. 更新相关文档

## 许可证

本项目采用 MIT 许可证。详情请参阅 LICENSE 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至：[您的邮箱]

## 致谢

感谢以下开源项目的支持：

- python-telegram-bot
- FastAPI
- Vercel
