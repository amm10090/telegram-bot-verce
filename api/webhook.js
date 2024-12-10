// api/webhook.js

import { Telegraf } from 'telegraf';

// 环境变量验证
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN environment variable is required');
}

// 创建 bot 实例 - 使用 singleton 模式确保在多个请求之间复用实例
let botInstance = null;
const getBot = () => {
    if (!botInstance) {
        botInstance = new Telegraf(BOT_TOKEN);
        configureBotCommands(botInstance);
    }
    return botInstance;
};

// 定义帮助文档内容
const HELP_CONTENT = `
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

// 设置自定义键盘布局
const MAIN_KEYBOARD = {
    reply_markup: {
        keyboard: [
            ['📚 帮助文档', '🔍 搜索'],
            ['⚙️ 设置', '📊 统计数据']
        ],
        resize_keyboard: true
    }
};

// 用户状态管理 - 使用 Map 实现内存缓存
const userStates = new Map();

// 配置机器人命令和处理函数
function configureBotCommands(bot) {
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
            await ctx.reply(welcomeMessage, MAIN_KEYBOARD);

            // 记录用户开始使用的时间
            userStates.set(ctx.from.id, {
                startTime: new Date(),
                lastActivity: new Date()
            });
        } catch (error) {
            console.error('Start command error:', error);
            await handleError(ctx, error);
        }
    });

    // 处理帮助文档按钮
    bot.hears('📚 帮助文档', async (ctx) => {
        try {
            await ctx.reply(HELP_CONTENT, MAIN_KEYBOARD);
            updateUserActivity(ctx.from.id);
        } catch (error) {
            console.error('Help document error:', error);
            await handleError(ctx, error);
        }
    });

    // 处理搜索功能
    bot.hears('🔍 搜索', async (ctx) => {
        try {
            userStates.set(ctx.from.id, {
                ...getUserState(ctx.from.id),
                searchMode: true,
                lastActivity: new Date()
            });

            await ctx.reply('请输入要搜索的关键词：', {
                reply_markup: {
                    keyboard: [['取消搜索']],
                    resize_keyboard: true
                }
            });
        } catch (error) {
            console.error('Search function error:', error);
            await handleError(ctx, error);
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
            await ctx.reply(settingsMessage, MAIN_KEYBOARD);
            updateUserActivity(ctx.from.id);
        } catch (error) {
            console.error('Settings error:', error);
            await handleError(ctx, error);
        }
    });

    // 处理统计数据按钮
    bot.hears('📊 统计数据', async (ctx) => {
        try {
            const userState = getUserState(ctx.from.id);
            const usageTime = userState?.startTime
                ? Math.floor((new Date() - userState.startTime) / 1000 / 60)
                : 0;

            const statsMessage = `
📊 使用统计

会话时长：${usageTime} 分钟
活跃度：${calculateActivityScore(userState)}%
命令使用次数：${userState?.commandCount || 0}

详细统计报告生成中...
`;
            await ctx.reply(statsMessage, MAIN_KEYBOARD);
            updateUserActivity(ctx.from.id);
        } catch (error) {
            console.error('Statistics error:', error);
            await handleError(ctx, error);
        }
    });

    // 处理取消搜索
    bot.hears('取消搜索', async (ctx) => {
        try {
            const userState = getUserState(ctx.from.id);
            if (userState?.searchMode) {
                userState.searchMode = false;
                userStates.set(ctx.from.id, userState);
                await ctx.reply('已取消搜索。', MAIN_KEYBOARD);
            }
            updateUserActivity(ctx.from.id);
        } catch (error) {
            console.error('Cancel search error:', error);
            await handleError(ctx, error);
        }
    });

    // 处理普通文本消息
    bot.on('text', async (ctx) => {
        try {
            const userState = getUserState(ctx.from.id);

            if (userState?.searchMode) {
                const searchTerm = ctx.message.text;
                await ctx.reply(`正在搜索："${searchTerm}"\n\n搜索结果将很快显示...`, MAIN_KEYBOARD);
                userState.searchMode = false;
                userStates.set(ctx.from.id, userState);
            }

            updateUserActivity(ctx.from.id);
        } catch (error) {
            console.error('Text handling error:', error);
            await handleError(ctx, error);
        }
    });

    // 全局错误处理
    bot.catch(async (error, ctx) => {
        console.error('Global error:', error);
        await handleError(ctx, error);
    });
}

// 辅助函数
function getUserState(userId) {
    return userStates.get(userId) || {
        startTime: new Date(),
        lastActivity: new Date(),
        commandCount: 0
    };
}

function updateUserActivity(userId) {
    const state = getUserState(userId);
    state.lastActivity = new Date();
    state.commandCount = (state.commandCount || 0) + 1;
    userStates.set(userId, state);
}

function calculateActivityScore(userState) {
    if (!userState) return 0;
    const hoursSinceLastActivity = (new Date() - userState.lastActivity) / 1000 / 60 / 60;
    return Math.max(0, Math.min(100, 100 - (hoursSinceLastActivity * 5)));
}

async function handleError(ctx, error) {
    const errorMessage = '抱歉，处理您的请求时出现错误。请稍后重试。';
    try {
        await ctx.reply(errorMessage, MAIN_KEYBOARD);
    } catch (replyError) {
        console.error('Error while sending error message:', replyError);
    }
}

// Vercel Serverless 函数处理程序
export default async function handler(request, response) {
    try {
        // 请求方法验证
        if (request.method !== 'POST') {
            return response.status(405).json({
                error: 'Method not allowed'
            });
        }

        // 获取请求体
        const update = request.body;
        if (!update) {
            return response.status(400).json({
                error: 'Request body is required'
            });
        }

        // 获取 bot 实例并处理更新
        const bot = getBot();
        await bot.handleUpdate(update);

        // 返回成功响应
        return response.status(200).json({ ok: true });
    } catch (error) {
        // 错误处理和日志记录
        console.error('Webhook handler error:', error);
        return response.status(500).json({
            ok: false,
            error: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message
        });
    }
}