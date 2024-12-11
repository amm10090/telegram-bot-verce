// webhook.js
import { Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';

// 数据库连接管理类
// 使用单例模式确保整个应用共享同一个数据库连接
class DatabaseManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            maxPoolSize: 10
        };
    }

    async connect() {
        // 如果已经存在数据库连接，直接返回
        if (this.db) {
            return this.db;
        }

        try {
            // 建立新的数据库连接
            if (!this.client) {
                this.client = await MongoClient.connect(
                    process.env.MONGODB_URI,
                    this.connectionOptions
                );
                console.log('Successfully connected to MongoDB');
            }
            this.db = this.client.db('bot_monitoring');
            this.retryCount = 0; // 重置重试计数
            return this.db;
        } catch (error) {
            // 实现重试机制
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying database connection (${this.retryCount}/${this.maxRetries})`);
                // 等待短暂时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.connect();
            }
            console.error('Failed to connect to MongoDB after retries:', error);
            throw error;
        }
    }

    async getCollection(name) {
        const db = await this.connect();
        return db.collection(name);
    }

    // 关闭数据库连接
    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }
}

// Bot 监控类
// 处理所有与监控和统计相关的功能
class BotMonitor {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.messageCache = new Map();
        this.statsUpdateInterval = null;
        this.isUpdating = false;
    }

    // 记录消息到数据库和缓存
    async logMessage(ctx) {
        try {
            // 设置操作超时保护
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database operation timeout')), 5000)
            );

            const operationPromise = (async () => {
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
            })();

            await Promise.race([operationPromise, timeoutPromise]);
        } catch (error) {
            console.error('Error logging message:', error);
            // 错误不影响bot正常运行
        }
    }

    // 更新消息缓存
    updateMessageCache(messageData) {
        const today = new Date().toISOString().split('T')[0];
        if (!this.messageCache.has(today)) {
            this.messageCache.set(today, {
                totalMessages: 0,
                uniqueUsers: new Set(),
                commands: 0,
                lastUpdate: new Date()
            });
        }

        const stats = this.messageCache.get(today);
        stats.totalMessages++;
        stats.uniqueUsers.add(messageData.userId);
        if (messageData.command) {
            stats.commands++;
        }
        stats.lastUpdate = new Date();
    }

    // 获取每日统计数据
    async getDailyStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dailyStats = await this.dbManager.getCollection('daily_stats');
            const stats = await dailyStats.findOne({ date: today });

            return {
                totalMessages: stats?.totalMessages || 0,
                uniqueUsers: stats?.uniqueUsers || 0,
                commands: stats?.commands || 0,
                lastUpdate: stats?.lastUpdate || new Date()
            };
        } catch (error) {
            console.error('Error getting daily stats:', error);
            return {
                totalMessages: 0,
                uniqueUsers: 0,
                commands: 0,
                lastUpdate: new Date()
            };
        }
    }

    // 更新每日统计数据到数据库
    async updateDailyStats() {
        if (this.isUpdating) {
            return;
        }

        this.isUpdating = true;
        try {
            const today = new Date().toISOString().split('T')[0];
            const stats = this.messageCache.get(today);

            if (stats) {
                const dailyStats = await this.dbManager.getCollection('daily_stats');
                await dailyStats.updateOne(
                    { date: new Date(today) },
                    {
                        $set: {
                            totalMessages: stats.totalMessages,
                            uniqueUsers: Array.from(stats.uniqueUsers).length,
                            commands: stats.commands,
                            lastUpdate: new Date()
                        }
                    },
                    { upsert: true }
                );
            }
        } catch (error) {
            console.error('Error updating daily stats:', error);
        } finally {
            this.isUpdating = false;
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

// Bot 配置和命令处理
const MAIN_KEYBOARD = {
    reply_markup: {
        keyboard: [
            ['📚 帮助文档', '🔍 搜索'],
            ['⚙️ 设置', '📊 统计数据']
        ],
        resize_keyboard: true
    }
};

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

// 全局实例
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

// 配置 Bot 命令
function configureBotCommands(bot) {
    // 中间件：记录所有消息
    bot.use(async (ctx, next) => {
        await monitor.logMessage(ctx);
        await next();
    });

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
        } catch (error) {
            console.error('Start command error:', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理帮助文档按钮
    bot.hears('📚 帮助文档', async (ctx) => {
        try {
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

    // 全局错误处理
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
    // 设置较长的超时时间
    response.setTimeout(30000);

    console.log('Incoming webhook request:', {
        timestamp: new Date().toISOString(),
        method: request.method,
        path: request.url
    });

    // 设置 CORS 头部
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
        return response.status(405).json({
            error: 'Method not allowed'
        });
    }

    try {
        // 验证请求体
        const update = request.body;
        if (!update) {
            return response.status(400).json({
                error: 'Request body is required'
            });
        }

        // 处理更新，设置超时保护
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Bot update timeout')), 8000)
        );

        const bot = getBot();
        const updatePromise = bot.handleUpdate(update);

        // 等待处理完成或超时
        await Promise.race([updatePromise, timeoutPromise]);

        // 异步更新统计数据
        if (!monitor.statsUpdateInterval) {
            monitor.statsUpdateInterval = setInterval(() => {
                monitor.updateDailyStats().catch(console.error);
            }, parseInt(process.env.MONITOR_UPDATE_INTERVAL || '60') * 1000);
        }

        return response.status(200).json({ ok: true });
    } catch (error) {
        console.error('Webhook handler error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // 根据环境返回适当的错误信息
        return response.status(500).json({
            ok: false,
            error: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message,
            details: process.env.NODE_ENV === 'development' ? {
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method
            } : undefined
        });
    } finally {
        // 在完成所有操作后执行清理工作
        try {
            // 检查是否需要清理消息缓存
            const now = new Date();
            for (const [date, stats] of monitor.messageCache.entries()) {
                const cacheDate = new Date(date);
                // 清理超过24小时的缓存数据
                if (now - cacheDate > 24 * 60 * 60 * 1000) {
                    monitor.messageCache.delete(date);
                }
            }

            // 如果服务器即将关闭，确保更新最后的统计数据
            if (process.env.VERCEL_REGION === 'dev1') {
                await monitor.updateDailyStats();
                clearInterval(monitor.statsUpdateInterval);
                monitor.statsUpdateInterval = null;
            }
        } catch (cleanupError) {
            // 记录清理过程中的错误，但不影响响应
            console.error('Cleanup error:', {
                message: cleanupError.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// 导出监控实例供其他模块使用
export const botMonitor = monitor;

// 导出数据库管理器实例供其他模块使用
export const databaseManager = dbManager;

// 提供一个清理函数用于优雅关闭
export async function cleanup() {
    try {
        // 清除统计更新定时器
        if (monitor.statsUpdateInterval) {
            clearInterval(monitor.statsUpdateInterval);
            monitor.statsUpdateInterval = null;
        }

        // 确保最后的统计数据被保存
        await monitor.updateDailyStats();

        // 关闭数据库连接
        await dbManager.close();

        // 重置所有实例
        botInstance = null;
        monitor.messageCache.clear();

        console.log('Cleanup completed successfully');
    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error; // 重新抛出错误以便上层处理
    }
}

// 添加进程退出时的清理处理
if (process.env.NODE_ENV !== 'production') {
    // 开发环境下添加进程退出处理
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, cleaning up...');
        await cleanup();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('SIGINT received, cleaning up...');
        await cleanup();
        process.exit(0);
    });
}