// api/webhook.js

// 引入必要的库
const { Telegraf } = require('telegraf');

// 创建 bot 实例
const bot = new Telegraf(process.env.BOT_TOKEN);

// 定义帮助文档内容
const helpContent = `
欢迎使用我们的服务！以下是主要功能介绍：

📚 帮助文档
- 查看所有可用命令和功能说明
- 获取使用指南和常见问题解答
- 了解最新功能更新

🔍 搜索
- 搜索相关内容和历史记录
- 查找特定功能或命令
- 快速定位所需信息

⚙️ 设置
- 调整个人偏好设置
- 修改通知选项
- 配置语言和时区

📊 统计数据
- 查看使用情况统计
- 分析数据趋势
- 获取详细报告
`;

// 定义自定义键盘布局
const mainKeyboard = {
    reply_markup: {
        keyboard: [
            ['📚 帮助文档', '🔍 搜索'],
            ['⚙️ 设置', '📊 统计数据']
        ],
        resize_keyboard: true
    }
};

// 存储用户搜索状态
const userSearchStates = new Map();

// 处理 /start 命令
bot.command('start', async (ctx) => {
    try {
        const welcomeMessage = `
👋 欢迎使用我们的服务！

请使用下方菜单选择需要的功能：
- 📚 查看帮助文档
- 🔍 搜索内容
- ⚙️ 调整设置
- 📊 查看统计

如需帮助，随时点击"帮助文档"按钮。
`;
        await ctx.reply(welcomeMessage, mainKeyboard);
    } catch (error) {
        console.error('启动命令错误:', error);
        await ctx.reply('抱歉，启动过程出现错误，请稍后重试。');
    }
});

// 处理帮助文档按钮
bot.hears('📚 帮助文档', async (ctx) => {
    try {
        await ctx.reply(helpContent, mainKeyboard);
    } catch (error) {
        console.error('帮助文档错误:', error);
        await ctx.reply('获取帮助文档时出现错误，请稍后重试。');
    }
});

// 处理搜索功能
bot.hears('🔍 搜索', async (ctx) => {
    try {
        userSearchStates.set(ctx.from.id, true);
        await ctx.reply('请输入要搜索的关键词：', {
            reply_markup: {
                keyboard: [['取消搜索']],
                resize_keyboard: true
            }
        });
    } catch (error) {
        console.error('搜索功能错误:', error);
        await ctx.reply('启动搜索功能时出现错误，请重试。');
    }
});

// 处理设置按钮
bot.hears('⚙️ 设置', async (ctx) => {
    try {
        const settingsMessage = `
设置选项：

1. 通知设置
2. 语言选择
3. 时区设置
4. 隐私选项

请回复数字选择对应设置：
`;
        await ctx.reply(settingsMessage, mainKeyboard);
    } catch (error) {
        console.error('设置功能错误:', error);
        await ctx.reply('访问设置时出现错误，请重试。');
    }
});

// 处理统计数据按钮
bot.hears('📊 统计数据', async (ctx) => {
    try {
        const statsMessage = `
📊 使用统计

今日活跃度：85%
消息总数：1,234
在线时长：98.5%

详细统计报告生成中...
`;
        await ctx.reply(statsMessage, mainKeyboard);
    } catch (error) {
        console.error('统计功能错误:', error);
        await ctx.reply('获取统计数据时出现错误，请重试。');
    }
});

// 处理取消搜索
bot.hears('取消搜索', async (ctx) => {
    try {
        userSearchStates.delete(ctx.from.id);
        await ctx.reply('已取消搜索。', mainKeyboard);
    } catch (error) {
        console.error('取消搜索错误:', error);
        await ctx.reply('取消搜索时出现错误，请重试。');
    }
});

// 处理搜索输入
bot.on('text', async (ctx) => {
    try {
        // 检查用户是否在搜索模式
        if (userSearchStates.get(ctx.from.id)) {
            const searchTerm = ctx.message.text;
            // 这里可以实现实际的搜索逻辑
            await ctx.reply(`正在搜索："${searchTerm}"\n\n搜索结果将很快显示...`, mainKeyboard);
            userSearchStates.delete(ctx.from.id);
        }
    } catch (error) {
        console.error('文本处理错误:', error);
        await ctx.reply('处理您的请求时出现错误，请重试。');
    }
});

// 错误处理中间件
bot.catch((error, ctx) => {
    console.error('Bot 错误:', error);
    return ctx.reply('抱歉，处理您的请求时出现错误。请稍后重试。');
});

// 导出 webhook 处理函数
module.exports = async (request, response) => {
    try {
        const { body } = request;
        await bot.handleUpdate(body);
        response.status(200).json({ ok: true });
    } catch (error) {
        console.error('Webhook 错误:', error);
        response.status(500).json({ ok: false, error: error.message });
    }
};