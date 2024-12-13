// monitoring.js - Telegram Bot 监控系统核心模块
import { MongoClient } from 'mongodb';

// 时区工具类 - 处理所有与时区相关的操作
const TimeZoneUtil = {
    // 中国时区偏移量（小时）
    CHINA_TIMEZONE_OFFSET: 8,

    // 将任意时间转换为中国时区时间
    toChinaTime(date) {
        const utcDate = new Date(date);
        return new Date(utcDate.getTime() + (this.CHINA_TIMEZONE_OFFSET * 60 * 60 * 1000));
    },

    // 获取中国时区的当天零点时间（用于数据库查询）
    getChinaToday() {
        const now = this.toChinaTime(new Date());
        now.setHours(0, 0, 0, 0);
        // 转换回 UTC 时间用于数据库查询
        return new Date(now.getTime() - (this.CHINA_TIMEZONE_OFFSET * 60 * 60 * 1000));
    },

    // 格式化时间为易读的中国时间格式
    formatChinaTime(date) {
        if (!date) return null;
        const chinaTime = this.toChinaTime(date);
        return chinaTime.toISOString().replace('T', ' ').substring(0, 19);
    }
};

// 日志工具 - 统一的日志记录格式
const logger = {
    // 记录普通信息
    info: (message, data = {}) => {
        console.log(message, typeof data === 'object' ? {
            时间戳: TimeZoneUtil.formatChinaTime(new Date()),
            ...Object.entries(data).reduce((acc, [key, value]) => ({
                ...acc,
                [translateKey(key)]: value
            }), {})
        } : data);
    },
    // 记录错误信息
    error: (message, error) => {
        console.error(message, {
            错误信息: error.message,
            堆栈信息: error.stack,
            时间戳: TimeZoneUtil.formatChinaTime(new Date())
        });
    }
};

// 键名翻译函数 - 将英文键名转换为中文
function translateKey(key) {
    const translations = {
        timestamp: '时间戳',
        userId: '用户ID',
        chatId: '聊天ID',
        messageType: '消息类型',
        command: '命令',
        status: '状态',
        count: '数量',
        type: '类型',
        severity: '严重程度',
        details: '详细信息',
        message: '消息内容',
        uptimeHours: '运行时间(小时)',
        mongoUser: 'MongoDB用户',
        username: '用户名',
        firstName: '名字',
        lastName: '姓氏',
        messageCount: '消息数量',
        commandCount: '命令数量',
        lastActive: '最后活跃时间',
        botMessage: '机器人消息',
        userMessage: '用户消息',
        totalMessages: '总消息数',
        activeUsers: '活跃用户数',
        commandsUsed: '命令使用数',
        updateTime: '更新时间'
    };
    return translations[key] || key;
}

/**
 * Bot监控类 - 处理所有监控相关功能
 */
class BotMonitor {
    constructor() {
        // 初始化成员变量
        this.mongoUrl = process.env.MONGODB_URI;
        this.client = null;
        this.db = null;
        this.startTime = TimeZoneUtil.toChinaTime(new Date());
        this.messageCache = new Map();
        this.statsUpdateInterval = null;

        // 执行初始化
        this.initialize();
    }

    /**
     * 初始化数据库连接和必要的配置
     */
    async initialize() {
        try {
            // 建立数据库连接
            this.client = await MongoClient.connect(this.mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            this.db = this.client.db('bot_monitoring');

            // 提取数据库用户信息
            const mongoUser = this.mongoUrl.split('@')[0].split('://')[1].split(':')[0];

            // 创建必要的索引
            await Promise.all([
                this.db.collection('messages').createIndex({ timestamp: -1 }),
                this.db.collection('messages').createIndex({ userId: 1 }),
                this.db.collection('messages').createIndex({ isUserMessage: 1 }),
                this.db.collection('daily_stats').createIndex({ date: 1 }, { unique: true }),
                this.db.collection('system_logs').createIndex({ timestamp: -1 })
            ]);

            // 记录初始化成功
            logger.info('监控系统初始化成功', { mongoUser });

            // 记录启动事件
            await this.logSystemEvent('监控系统启动', 'startup', 'info', {
                mongoUser,
                startTime: TimeZoneUtil.formatChinaTime(this.startTime)
            });
        } catch (error) {
            logger.error('监控系统初始化失败', error);
            throw error;
        }
    }

    /**
     * 判断是否为用户消息（非机器人消息）
     * @param {Object} message Telegram消息对象
     */
    isUserMessage(message) {
        // 检查基本条件：消息存在且发送者不是机器人
        if (!message.from || message.from.is_bot) {
            return false;
        }

        // 检查是否为命令消息
        if (message.text && message.text.startsWith('/')) {
            return true;
        }

        // 检查是否为普通用户消息
        return message.from.id && !message.from.is_bot;
    }

    /**
     * 记录消息统计信息
     * @param {Object} message Telegram消息对象
     */
    async logMessage(message) {
        try {
            // 过滤非用户消息
            if (!this.isUserMessage(message)) {
                logger.info('跳过非用户消息', {
                    fromBot: message.from?.is_bot,
                    messageType: message.text ? 'text' : 'other'
                });
                return;
            }

            // 构建消息统计数据
            const chinaTime = TimeZoneUtil.toChinaTime(new Date());
            const messageStats = {
                timestamp: chinaTime,
                userId: message.from.id,
                chatId: message.chat.id,
                messageType: message.text ? 'text' : 'other',
                command: message.text?.startsWith('/') ? message.text.split(' ')[0] : null,
                isUserMessage: true,
                metadata: {
                    username: message.from.username,
                    firstName: message.from.first_name,
                    lastName: message.from.last_name
                }
            };

            // 保存到数据库
            await this.db.collection('messages').insertOne(messageStats);
            await this.updateDailyStats();

            // 记录日志
            logger.info('用户消息已记录', {
                userId: message.from.id,
                timestamp: TimeZoneUtil.formatChinaTime(chinaTime)
            });
        } catch (error) {
            logger.error('记录消息统计失败', error);
            await this.reconnectIfNeeded();
        }
    }

    /**
     * 更新每日统计数据
     */
    async updateDailyStats() {
        const today = TimeZoneUtil.getChinaToday();

        try {
            // 使用聚合管道计算统计数据
            const stats = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today },
                        isUserMessage: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalMessages: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$userId" },
                        commands: {
                            $sum: {
                                $cond: [{ $ne: ["$command", null] }, 1, 0]
                            }
                        }
                    }
                }
            ]).toArray();

            // 构建统计数据对象
            const dailyStats = {
                date: today,
                totalMessages: stats[0]?.totalMessages || 0,
                activeUsers: stats[0]?.uniqueUsers?.length || 0,
                commandsUsed: stats[0]?.commands || 0,
                lastUpdated: TimeZoneUtil.toChinaTime(new Date())
            };

            // 更新数据库
            await this.db.collection('daily_stats').updateOne(
                { date: today },
                { $set: dailyStats },
                { upsert: true }
            );

            // 记录日志
            logger.info('每日统计已更新', {
                totalMessages: dailyStats.totalMessages,
                activeUsers: dailyStats.activeUsers,
                commandsUsed: dailyStats.commandsUsed,
                updateTime: TimeZoneUtil.formatChinaTime(dailyStats.lastUpdated)
            });

            return dailyStats;
        } catch (error) {
            logger.error('更新每日统计失败', error);
            return null;
        }
    }

    /**
     * 获取消息趋势数据（24小时）
     */
    async getMessageTrend() {
        try {
            const today = TimeZoneUtil.getChinaToday();

            // 构建聚合管道
            const pipeline = [
                {
                    $match: {
                        timestamp: { $gte: today },
                        isUserMessage: true
                    }
                },
                {
                    $addFields: {
                        // 转换时间到中国时区
                        chinaHour: {
                            $hour: {
                                $add: ['$timestamp', TimeZoneUtil.CHINA_TIMEZONE_OFFSET * 60 * 60 * 1000]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$chinaHour',
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' }
                    }
                },
                {
                    $sort: { '_id': 1 }
                }
            ];

            // 执行聚合查询
            const trend = await this.db.collection('messages').aggregate(pipeline).toArray();

            // 填充完整24小时数据
            const fullTrend = Array.from({ length: 24 }, (_, hour) => {
                const hourData = trend.find(t => t._id === hour);
                return {
                    hour,
                    count: hourData?.count || 0,
                    uniqueUsers: hourData?.uniqueUsers?.length || 0,
                    time: `${String(hour).padStart(2, '0')}:00`
                };
            });

            return fullTrend;
        } catch (error) {
            logger.error('获取消息趋势失败', error);
            return [];
        }
    }

    /**
     * 获取系统状态信息
     */
    async getSystemStatus() {
        try {
            const now = TimeZoneUtil.toChinaTime(new Date());
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            // 获取最近活动数据
            const recentMessages = await this.db.collection('messages').countDocuments({
                timestamp: { $gte: fiveMinutesAgo },
                isUserMessage: true
            });

            // 获取数据库连接信息
            const mongoUser = this.mongoUrl.split('@')[0].split('://')[1].split(':')[0];

            // 计算运行时间
            const uptimeHours = (now - this.startTime) / (1000 * 60 * 60);

            // 构建状态对象
            const status = {
                status: recentMessages > 0 ? 'active' : 'idle',
                lastActivity: await this.db.collection('messages')
                    .findOne({ isUserMessage: true }, { sort: { timestamp: -1 } })
                    .then(doc => doc ? TimeZoneUtil.formatChinaTime(doc.timestamp) : null),
                uptimeHours: Math.round(uptimeHours * 100) / 100,
                mongoUser: mongoUser,
                mongoStatus: this.client?.topology?.isConnected() ? 'connected' : 'disconnected',
                lastUpdate: TimeZoneUtil.formatChinaTime(now)
            };

            logger.info('系统状态已更新', status);
            return status;
        } catch (error) {
            logger.error('获取系统状态失败', error);
            return null;
        }
    }

    /**
     * 获取用户统计信息
     * @param {string|number} userId 用户ID
     */
    async getUserStats(userId) {
        try {
            const today = TimeZoneUtil.getChinaToday();

            // 聚合计算用户统计数据
            const stats = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today },
                        userId: userId,
                        isUserMessage: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        messageCount: { $sum: 1 },
                        commandCount: {
                            $sum: { $cond: [{ $ne: ["$command", null] }, 1, 0] }
                        },
                        lastActive: { $max: "$timestamp" }
                    }
                }
            ]).toArray();

            const userStats = stats[0] || {
                messageCount: 0,
                commandCount: 0,
                lastActive: null
            };

            // 格式化时间
            if (userStats.lastActive) {
                userStats.lastActive = TimeZoneUtil.formatChinaTime(userStats.lastActive);
            }

            return userStats;
        } catch (error) {
            logger.error('获取用户统计失败', error);
            return null;
        }
    }

    /**
        * 检查并重新连接数据库
        * 在连接断开时自动重连
        */
    async reconnectIfNeeded() {
        if (!this.client?.topology?.isConnected()) {
            logger.info('尝试重新连接数据库');
            try {
                await this.initialize();
                logger.info('数据库重新连接成功');
            } catch (error) {
                logger.error('数据库重新连接失败', error);
            }
        }
    }

    /**
     * 记录系统事件
     * @param {string} message 事件消息
     * @param {string} type 事件类型
     * @param {string} severity 严重程度
     * @param {Object} details 详细信息
     */
    async logSystemEvent(message, type = 'info', severity = 'low', details = {}) {
        try {
            // 构建日志条目
            const logEntry = {
                timestamp: TimeZoneUtil.toChinaTime(new Date()),
                type,
                message,
                severity,
                details: {
                    ...details,
                    uptime: Math.round((Date.now() - this.startTime) / 1000)
                }
            };

            // 写入数据库
            await this.db.collection('system_logs').insertOne(logEntry);
            logger.info('系统事件已记录', { type, message });
        } catch (error) {
            logger.error('记录系统事件失败', error);
        }
    }

    /**
     * 获取系统日志
     * @param {number} limit 返回的日志数量限制
     * @param {string} severity 日志严重程度过滤
     */
    async getSystemLogs(limit = 50, severity = null) {
        try {
            // 构建查询条件
            const query = severity ? { severity } : {};

            // 查询日志
            const logs = await this.db.collection('system_logs')
                .find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();

            // 格式化时间戳
            return logs.map(log => ({
                timestamp: TimeZoneUtil.formatChinaTime(log.timestamp),
                type: log.type,
                message: log.message,
                severity: log.severity,
                details: log.details
            }));
        } catch (error) {
            logger.error('获取系统日志失败', error);
            return [];
        }
    }

    /**
     * 清理过期缓存数据
     * 删除24小时前的缓存记录
     */
    cleanupCache() {
        const now = new Date();
        for (const [date, stats] of this.messageCache.entries()) {
            const cacheDate = new Date(date);
            if (now - cacheDate > 24 * 60 * 60 * 1000) {
                this.messageCache.delete(date);
                logger.info('已清理过期缓存', { date });
            }
        }
    }

    /**
     * 安全关闭监控系统
     * 清理资源并关闭数据库连接
     */
    async shutdown() {
        try {
            // 记录关闭事件
            await this.logSystemEvent('监控系统关闭', 'shutdown', 'info', {
                uptime: Math.round((Date.now() - this.startTime) / 1000)
            });

            // 清理定时器
            if (this.statsUpdateInterval) {
                clearInterval(this.statsUpdateInterval);
                this.statsUpdateInterval = null;
            }

            // 清理缓存数据
            this.messageCache.clear();

            // 关闭数据库连接
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
            }

            logger.info('监控系统已安全关闭');
        } catch (error) {
            logger.error('关闭监控系统时出错', error);
            throw error;
        }
    }
}

// 创建监控系统单例
const monitor = new BotMonitor();

// 导出监控系统实例
export default monitor;