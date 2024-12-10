// index.js - 主要的 webhook 处理程序
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

// 定义菜单键盘布局
const menuKeyboard = {
    reply_markup: {
        keyboard: [
            ['📚 帮助文档', '🔍 搜索'],
            ['⚙️ 设置', '📊 统计数据']
        ],
        resize_keyboard: true  // 允许键盘大小自适应
    }
};

// 处理 /start 命令
bot.command('start', (ctx) => {
    const welcomeMessage = `
👋 欢迎使用我们的机器人！

请使用下方菜单进行操作：
- 📚 帮助文档：查看使用指南
- 🔍 搜索：搜索相关内容
- ⚙️ 设置：调整机器人设置
- 📊 统计：查看使用统计
  `;
    return ctx.reply(welcomeMessage, menuKeyboard);
});

// 导出 webhook 处理函数供 Vercel 使用
module.exports = async (request, response) => {
    try {
        const { body } = request;
        if (body.message) {
            await bot.handleUpdate(body);
        }
        response.status(200).json({ message: '处理成功' });
    } catch (error) {
        console.error('webhook 处理出错:', error);
        response.status(500).json({ error: '更新处理失败' });
    }
};