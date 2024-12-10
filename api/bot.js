const TelegramBot = require('node-telegram-bot-api');

// 从环境变量中初始化机器人 token
const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN);

// Webhook 处理函数
module.exports = async (req, res) => {
    try {
        // 验证请求体是否存在
        if (!req.body) {
            console.log('接收到空的请求体');
            return res.status(400).send('错误请求：请求体为空');
        }

        const update = req.body;

        // 验证更新结构
        if (!update) {
            console.log('接收到无效的更新');
            return res.status(400).send('错误请求：无效的更新');
        }

        // 处理 /start 命令
        if (update.message && update.message.text === '/start') {
            try {
                const chatId = update.message.chat.id;
                await bot.sendMessage(chatId, '👋 欢迎使用我的 Telegram Bot！');
                console.log(`已向聊天 ${chatId} 发送欢迎消息`);
            } catch (error) {
                console.error('发送欢迎消息时出错：', error);
                // 继续处理以返回 200 OK
            }
        }

        // 始终向 Telegram 返回 200 OK
        return res.status(200).send('OK');
    } catch (error) {
        console.error('处理 webhook 时出错：', error);
        // 仍然返回 200 OK 以防止 Telegram 重试
        return res.status(200).send('OK');
    }
};