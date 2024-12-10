const TelegramBot = require('node-telegram-bot-api');

// 从环境变量读取 Telegram Bot Token
const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN);

// Webhook 处理函数
module.exports = async (req, res) => {
    // 解析 Telegram 推送过来的更新
    const update = req.body;

    // 响应 /start 命令
    if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        await bot.sendMessage(chatId, '👋 欢迎使用我的 Telegram Bot！');
    }

    // 返回 HTTP 200 响应给 Telegram
    res.status(200).send("OK");
};
