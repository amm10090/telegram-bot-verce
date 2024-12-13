// webhook.js
import { Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';

// 日志工具函数 - 统一处理日志格式和语言
const logger = {
    info: (message, data = {}) => {
        console.log(message, typeof data === 'object' ? {
            时间戳: new Date().toISOString(),
            ...Object.entries(data).reduce((acc, [key, value]) => ({
                ...acc,
                [translateKey(key)]: value
            }), {})
        } : data);
    },
    error: (message, error) => {
        console.error(message, {
            错误信息: error.message,
            堆栈信息: error.stack,
            时间戳: new Date().toISOString()
        });
    }
};

// 键名翻译函数 - 将英文键名转换为中文
function translateKey(key) {
    const translations = {
        timestamp: '时间戳',
        method: '请求方法',
        path: '请求路径',
        userId: '用户ID',
        username: '用户名',
        messageType: '消息类型',
        command: '命令',
        status: '状态',
        error: '错误',
        stack: '堆栈',
        message: '消息'
    };
    return translations[key] || key;
}

/**
 * 数据库管理类
 * 使用单例模式管理数据库连接，确保连接的复用和稳定性
 */
class DatabaseManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.connectionOptions = {
            ssl: true,
            tls: true,
            tlsAllowInvalidCertificates: false,
            minPoolSize: 1,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority',
            directConnection: false,

            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            replicaSet: 'atlas-3x8mx9-shard-0',
            readPreference: 'primary'
        };
    }

    async connect() {
        if (this.db) {
            return this.db;
        }

        try {
            if (!this.client) {
                this.client = await MongoClient.connect(
                    process.env.MONGODB_URI,
                    this.connectionOptions
                );
                this.db = this.client.db('bot_monitoring');
                logger.info('MongoDB连接成功');
            }
            return this.db;
        } catch (error) {
            logger.error('MongoDB连接错误', error);
            throw error;
        }
    }

    async getCollection(name) {
        const db = await this.connect();
        return db.collection(name);
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            logger.info('数据库连接已关闭');
        }
    }
}

/**
 * Bot 监控类
 * 处理所有监控和统计相关的功能
 */
class BotMonitor {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.messageCache = new Map();
        this.statsUpdateInterval = null;
        this.isUpdating = false;
        this.operationTimeout = 3000;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.db = null;
        this.initializeDB();

    }
    async initializeDB() {
        try {
            this.db = await this.dbManager.connect();
            console.log('数据库连接初始化成功');
        } catch (error) {
            console.error('数据库初始化失败:', error);
        }
    }



    // 修改 monitoring.js 中的 logMessage 函数
    async logMessage(message) {
        try {
            // 确保数据库已初始化
            if (!this.db) {
                await this.initializeDB();
            }

            // 添加消息去重逻辑
            const messageId = message.message_id || message.update_id;
            const messagesCollection = this.db.collection('messages');

            const existingMessage = await messagesCollection.findOne({ messageId });
            if (existingMessage) {
                console.log('跳过重复消息:', messageId);
                return;
            }

            // 构建消息数据
            const messageStats = {
                messageId,
                timestamp: new Date(),
                userId: message.from?.id,
                chatId: message.chat?.id,
                messageType: message.text ? 'text' : 'other',
                command: message.text?.startsWith('/') ? message.text.split(' ')[0] : null,
                isUserMessage: true,
                metadata: {
                    username: message.from?.username,
                    firstName: message.from?.first_name,
                    lastName: message.from?.last_name
                }
            };

            await messagesCollection.insertOne(messageStats);
            await this.updateDailyStats();

        } catch (error) {
            console.error('记录消息统计失败:', error);
            // 添加重试逻辑
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.logMessage(message);
            }
        }
    }

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

    async retryOperation(operation, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await operation();
                return;
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                logger.info(`操作重试 (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    }

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
            logger.error('获取每日统计数据错误', error);
            return {
                totalMessages: 0,
                uniqueUsers: 0,
                commands: 0,
                lastUpdate: new Date()
            };
        }
    }

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
                logger.info('每日统计数据已更新');
            }
        } catch (error) {
            logger.error('更新每日统计数据错误', error);
        } finally {
            this.isUpdating = false;
        }
    }

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
            logger.error('错误日志记录失败', err);
        }
    }
}

// Bot键盘布局配置
const MAIN_KEYBOARD = {
    reply_markup: {
        keyboard: [
            ['📚 帮助文档', '🔍 搜索'],
            ['⚙️ 设置', '📊 统计数据']
        ],
        resize_keyboard: true
    }
};

// 帮助文档内容
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

const getBot = () => {
    if (!botInstance) {
        botInstance = new Telegraf(process.env.BOT_TOKEN);
        configureBotCommands(botInstance);
    }
    return botInstance;
};

function configureBotCommands(bot) {
    // 中间件：记录所有消息
    bot.use(async (ctx, next) => {
        await monitor.logMessage(ctx);
        await next();
    });

    // 处理 /start 命令
    bot.command('start', async (ctx) => {
        try {
            logger.info('处理 /start 命令', {
                userId: ctx.from?.id,
                username: ctx.from?.username
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
            logger.error('处理 /start 命令出错', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理帮助文档按钮
    bot.hears('📚 帮助文档', async (ctx) => {
        try {
            logger.info('访问帮助文档', {
                userId: ctx.from?.id
            });
            await ctx.reply(HELP_CONTENT, MAIN_KEYBOARD);
        } catch (error) {
            logger.error('访问帮助文档出错', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理搜索功能
    bot.hears('🔍 搜索', async (ctx) => {
        try {
            logger.info('开始搜索', {
                userId: ctx.from?.id
            });
            await ctx.reply('请输入要搜索的关键词：', {
                reply_markup: {
                    keyboard: [['取消搜索']],
                    resize_keyboard: true
                }
            });
        } catch (error) {
            logger.error('搜索功能出错', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理设置按钮
    bot.hears('⚙️ 设置', async (ctx) => {
        try {
            logger.info('访问设置', {
                userId: ctx.from?.id
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
            logger.error('访问设置出错', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理统计数据按钮
    bot.hears('📊 统计数据', async (ctx) => {
        try {
            logger.info('访问统计数据', {
                userId: ctx.from?.id
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
            logger.error('访问统计数据出错', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理取消搜索
    bot.hears('取消搜索', async (ctx) => {
        try {
            logger.info('取消搜索', {
                userId: ctx.from?.id
            });
            await ctx.reply('已取消搜索。', MAIN_KEYBOARD);
        } catch (error) {
            logger.error('取消搜索出错', error);
            await monitor.logError(error, ctx);
            await handleError(ctx, error);
        }
    });

    // 处理错误情况
    bot.catch(async (error, ctx) => {
        logger.error('全局错误', error);
        await monitor.logError(error, ctx);
        await handleError(ctx, error);
    });
}

async function handleError(ctx, error) {
    const errorMessage = '抱歉，处理您的请求时出现错误。请稍后重试。';
    try {
        await ctx.reply(errorMessage, MAIN_KEYBOARD);
    } catch (replyError) {
        logger.error('发送错误消息失败', {
            原始错误: error,
            回复错误: replyError
        });
    }
}

// Vercel Serverless 函数处理程序
export default async function handler(request, response) {
    // 设置请求超时保护
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('请求超时')), 8000)
    );

    logger.info('收到webhook请求', {
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

    try {
        // 快速响应处理
        const handleRequestPromise = (async () => {
            if (request.method === 'POST') {
                const update = request.body;
                if (!update) {
                    return response.status(400).json({
                        error: '请求体不能为空'
                    });
                }

                const bot = getBot();

                // 异步处理消息更新
                await bot.handleUpdate(update);

                // 异步处理数据库操作
                setImmediate(async () => {
                    try {
                        await monitor.logMessage(update);
                    } catch (error) {
                        logger.error('异步操作错误', error);
                    }
                });

                // 设置定时更新统计数据
                if (!monitor.statsUpdateInterval) {
                    monitor.statsUpdateInterval = setInterval(() => {
                        monitor.updateDailyStats().catch(error => {
                            logger.error('更新统计数据错误', error);
                        });
                    }, parseInt(process.env.MONITOR_UPDATE_INTERVAL || '60') * 1000);
                }

                return response.status(200).json({ ok: true });
            }
            return response.status(405).json({ error: '不支持的请求方法' });
        })();

        // 使用 Promise.race 确保请求不会超时
        await Promise.race([handleRequestPromise, timeoutPromise]);
    } catch (error) {
        logger.error('Webhook处理错误', error);

        // 根据环境返回适当的错误信息
        return response.status(500).json({
            ok: false,
            error: process.env.NODE_ENV === 'production'
                ? '服务器内部错误'
                : error.message,
            details: process.env.NODE_ENV === 'development' ? {
                时间戳: new Date().toISOString(),
                路径: request.url,
                方法: request.method
            } : undefined
        });
    } finally {
        // 清理过期缓存和资源
        try {
            // 检查并清理过期的消息缓存（24小时前的数据）
            const now = new Date();
            for (const [date, stats] of monitor.messageCache.entries()) {
                const cacheDate = new Date(date);
                if (now - cacheDate > 24 * 60 * 60 * 1000) {
                    monitor.messageCache.delete(date);
                    logger.info('已清理过期缓存', { date });
                }
            }
        } catch (error) {
            logger.error('清理缓存出错', error);
        }
    }
}

/**
 * 清理函数
 * 用于在进程结束前进行资源清理
 */
export async function cleanup() {
    try {
        // 清除定时器
        if (monitor.statsUpdateInterval) {
            clearInterval(monitor.statsUpdateInterval);
            monitor.statsUpdateInterval = null;
            logger.info('已清理统计更新定时器');
        }

        // 确保最后的统计数据被保存
        await monitor.updateDailyStats();
        logger.info('已保存最终统计数据');

        // 关闭数据库连接
        await dbManager.close();
        logger.info('已关闭数据库连接');

        // 清理实例
        botInstance = null;
        monitor.messageCache.clear();
        logger.info('已清理所有缓存数据');

        logger.info('清理工作已完成');
    } catch (error) {
        logger.error('清理过程出错', error);
        throw error;
    }
}

// 添加进程退出处理（仅在开发环境）
if (process.env.NODE_ENV !== 'production') {
    process.on('SIGTERM', async () => {
        logger.info('收到 SIGTERM 信号，开始清理...');
        await cleanup();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.info('收到 SIGINT 信号，开始清理...');
        await cleanup();
        process.exit(0);
    });
}

// 导出监控实例供其他模块使用
export const botMonitor = monitor;

// 导出数据库管理器实例供其他模块使用
export const databaseManager = dbManager;