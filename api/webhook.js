// api/webhook.js

import { Telegraf } from 'telegraf';

// 环境变量验证 - 确保机器人能够正常运行的必要条件
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN environment variable is required');
}

// 使用单例模式管理 bot 实例
// 这确保了在多个请求之间复用同一个实例，提高性能并维持状态一致性
let botInstance = null;
const getBot = () => {
    if (!botInstance) {
        botInstance = new Telegraf(BOT_TOKEN);
        configureBotCommands(botInstance);
    }
    return botInstance;
};

// 定义帮助文档内容 - 为用户提供清晰的功能指引
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

// 设置自定义键盘布局 - 提供用户友好的交互界面
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
// 注意：在 Serverless 环境中，这个状态在函数调用之间不会保持
const userStates = new Map();

// 配置机器人命令和处理函数
function configureBotCommands(bot) {
    // 处理 /start 命令 - 用户初次接触机器人时的入口
    bot.command('start', async (ctx) => {
        try {
            console.log('Processing /start command:', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
                timestamp: new Date().toISOString()
            });

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
            console.error('Start command error:', {
                error: error.message,
                userId: ctx.from?.id,
                timestamp: new Date().toISOString()
            });
            await handleError(ctx, error);
        }
    });

    // 处理帮助文档按钮
    bot.hears('📚 帮助文档', async (ctx) => {
        try {
            console.log('Accessing help document:', {
                userId: ctx.from?.id,
                timestamp: new Date().toISOString()
            });
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
            console.log('Initiating search:', {
                userId: ctx.from?.id,
                timestamp: new Date().toISOString()
            });
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
            console.log('Accessing settings:', {
                userId: ctx.from?.id,
                timestamp: new Date().toISOString()
            });
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
            console.log('Accessing statistics:', {
                userId: ctx.from?.id,
                timestamp: new Date().toISOString()
            });
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
            console.log('Cancelling search:', {
                userId: ctx.from?.id,
                timestamp: new Date().toISOString()
            });
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
            console.log('Received text message:', {
                userId: ctx.from?.id,
                messageText: ctx.message?.text,
                timestamp: new Date().toISOString()
            });
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
        console.error('Global error:', {
            error: error.message,
            userId: ctx.from?.id,
            timestamp: new Date().toISOString()
        });
        await handleError(ctx, error);
    });
}

// 辅助函数 - 用于管理用户状态和计算活跃度
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
        console.error('Error while sending error message:', {
            originalError: error.message,
            replyError: replyError.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Vercel Serverless 函数处理程序
export default async function handler(request, response) {
    // 添加请求日志记录
    console.log('Incoming webhook request:', {
        timestamp: new Date().toISOString(),
        method: request.method,
        headers: request.headers,
        url: request.url,
        body: JSON.stringify(request.body, null, 2)
    });

    // 设置 CORS 头部
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        console.log('Handling OPTIONS request');
        return response.status(200).end();
    }

    try {
        // 请求方法验证
        if (request.method !== 'POST') {
            console.log('Rejected non-POST request:', request.method);
            return response.status(405).json({
                error: 'Method not allowed',
                allowedMethods: ['POST']
            });
        }

        // 获取和验证请求体
        const update = request.body;
        if (!update) {
            console.log('Empty request body received');
            return response.status(400).json({
                error: 'Request body is required'
            });
        }

        console.log('Processing Telegram update:', {
            updateId: update.update_id,
            messageId: update.message?.message_id,
            chatId: update.message?.chat?.id,
            text: update.message?.text
        });

        // 获取 bot 实例并处理更新
        const bot = getBot();
        console.log('Bot instance retrieved successfully');

        await bot.handleUpdate(update);
        console.log('Update handled successfully');

        // 返回成功响应
        return response.status(200).json({ ok: true });
    } catch (error) {
        // 详细的错误日志记录
        console.error('Webhook handler error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            requestBody: request.body
        });

        // 返回适当的错误响应
        return response.status(500).json({
            ok: false,
            error: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message
        });
    }
}