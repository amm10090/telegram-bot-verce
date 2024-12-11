// webhook.js
import { Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';

// 数据库管理类：负责处理所有与 MongoDB 相关的操作
class DatabaseManager {
    constructor() {
        this.client = null;
        this.db = null;
    }

    // 建立数据库连接，使用单例模式确保连接复用
    async connect() {
        if (!this.client) {
            try {
                this.client = await MongoClient.connect(process.env.MONGODB_URI);
                this.db = this.client.db('bot_monitoring');
                console.log('Successfully connected to MongoDB');
            } catch (error) {
                console.error('MongoDB connection error:', error);
                throw error;
            }
        }
        return this.db;
    }

    // 获取指定的集合
    async getCollection(name) {
        const db = await this.connect();
        return db.collection(name);
    }
}

// Bot 监控类：处理所有监控和统计相关的功能
class BotMonitor {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.messageCache = new Map();
        this.statsUpdateInterval = null;
    }

    // 记录消息到数据库和缓存
    async logMessage(ctx) {
        try {
            const messages = await this.dbManager.getCollection('messages');
            const messageData = {
                timestamp: new Date(),
                userId: ctx.from?.id,
                chatId: ctx.chat?.id,
                messageType: ctx.message?.text ? 'text' : 'other',
                command: ctx.message?.text?.startsWith('/') ? ctx.message.text.split(' ')[0] : null,
                metadata: {
                    username: ctx.from?.username,
                    firstName: ctx.from?.first_name,
                    lastName: ctx.from?.last_name
                }
            };

            await messages.insertOne(messageData);
            this.updateMessageCache(messageData);
        } catch (error) {
            console.error('Error logging message:', error);
        }
    }

    // 更新内存中的消息统计缓存
    updateMessageCache(messageData) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.messageCache.has(today)) {
            this.messageCache.set(today, {
                totalMessages: 0,
                uniqueUsers: new Set(),
                commands: 0
            });
        }

        const stats = this.messageCache.get(today);
        stats.totalMessages++;
        stats.uniqueUsers.add(messageData.userId);
        if (messageData.command) {
            stats.commands++;
        }
    }

    // 更新每日统计数据到数据库
    async updateDailyStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const stats = this.messageCache.get(today);

            if (stats) {
                const dailyStats = await this.dbManager.getCollection('daily_stats');
                await dailyStats.updateOne(
                    { date: today },
                    {
                        $set: {
                            totalMessages: stats.totalMessages,
                            uniqueUsers: Array.from(stats.uniqueUsers).length,
                            commands: stats.commands,
                            lastUpdated: new Date()
                        }
                    },
                    { upsert: true }
                );
            }
        } catch (error) {
            console.error('Error updating daily stats:', error);
        }
    }

    // 记录错误信息
    async logError(error, ctx) {
        try {
            const errors = await this.dbManager.getCollection('errors');
            await errors.insertOne({
                timestamp: new Date(),
                error: error.message,
                stack: error.stack,
                context: {
                    userId: ctx?.from?.id,
                    chatId: ctx?.chat?.id,
                    command: ctx?.message?.text
                }
            });
        } catch (err) {
            console.error('Error logging error:', err);
        }
    }
}

// 定义主键盘布局
const MAIN_KEYBOARD = {
    reply_markup: {
        keyboard: [
            ['📚 帮助文档', '🔍 搜索'],
            ['⚙️ 设置', '📊 统计数据']
        ],
        resize_keyboard: true
    }
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

// 创建全局实例
let botInstance = null;
const dbManager = new DatabaseManager();
const monitor = new BotMonitor(dbManager);

// Bot 实例获取函数
const getBot = () => {
    if (!botInstance) {
        botInstance = new Telegraf(process.env.BOT_TOKEN);
        configureBotCommands(botInstance);
    }
    return botInstance;
};

// 配置 Bot 命令和处理函数
function configureBotCommands(bot) {
    // 中间件：记录所有消息
    bot.use(async (ctx, next) => {
        await monitor.logMessage(ctx);
        await next();
    });

    // 处理 /start 命令
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
        } catch (error) {
            console.error('Start command error:', error);
            await monitor.logError(error, ctx);
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
        } catch (error) {
            console.error('Help document error:', error);
            await monitor.logError(error, ctx);
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
            await ctx.reply('请输入要搜索的关键词：', {
                reply_markup: {
                    keyboard: [['取消搜索']],
                    resize_keyboard: true
                }
            });
        } catch (error) {
            console.error('Search function error:', error);
            await monitor.logError(error, ctx);
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
        } catch (error) {
            console.error('Settings error:', error);
            await monitor.logError(error, ctx);
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
            const stats = await monitor.getDailyStats();
            const statsMessage = `
📊 今日统计

总消息数：${stats.totalMessages || 0}
活跃用户：${stats.uniqueUsers || 0}
命令使用：${stats.commands || 0}
`;
            await ctx.reply(statsMessage, MAIN_KEYBOARD);
        } catch (error) {
            console.error('Statistics error:', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理取消搜索
    bot.hears('取消搜索', async (ctx) => {
        try {
            await ctx.reply('已取消搜索。', MAIN_KEYBOARD);
        } catch (error) {
            console.error('Cancel search error:', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理错误情况
    bot.catch(async (error, ctx) => {
        console.error('Global error:', error);
        await monitor.logError(error, ctx);
        await handleError(ctx, error);
    });
}

// 错误处理函数
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
    console.log('Incoming webhook request:', {
        timestamp: new Date().toISOString(),
        method: request.method
    });

    // 设置 CORS 头部
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        // 验证请求方法
        if (request.method !== 'POST') {
            return response.status(405).json({
                error: 'Method not allowed'
            });
        }

        // 验证请求体
        const update = request.body;
        if (!update) {
            return response.status(400).json({
                error: 'Request body is required'
            });
        }

        // 处理更新
        const bot = getBot();
        await bot.handleUpdate(update);

        // 设置定时更新统计数据
        if (!monitor.statsUpdateInterval) {
            monitor.statsUpdateInterval = setInterval(() => {
                monitor.updateDailyStats();
            }, parseInt(process.env.MONITOR_UPDATE_INTERVAL || '60') * 1000);
        }

        return response.status(200).json({ ok: true });
    } catch (error) {
        console.error('Webhook handler error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return response.status(500).json({
            ok: false,
            error: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message
        });
    }
}