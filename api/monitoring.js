// monitoring.js - Bot监控系统核心模块
import { MongoClient } from 'mongodb';

/**
 * 时区工具类
 * 处理所有与时区相关的操作，统一使用中国时区(UTC+8)
 */
const TimeZoneUtil = {
    // 中国时区偏移（小时）
    CHINA_TIMEZONE_OFFSET: 8,

    // 获取中国时区的当前时间
    getChinaTime() {
        const now = new Date();
        return new Date(now.getTime() + (this.CHINA_TIMEZONE_OFFSET * 60 - now.getTimezoneOffset()) * 60000);
    },

    // 获取中国时区的今日零点时间
    getChinaToday() {
        const chinaTime = this.getChinaTime();
        chinaTime.setHours(0, 0, 0, 0);
        return chinaTime;
    },

    // 格式化时间为中国时区格式
    formatChinaTime(date) {
        if (!date) return null;
        const chinaTime = new Date(date.getTime() + (this.CHINA_TIMEZONE_OFFSET * 60 - date.getTimezoneOffset()) * 60000);
        return chinaTime.toISOString().replace('T', ' ').substring(0, 19);
    },

    // 获取中国时区的小时数
    getChinaHour(date) {
        const chinaTime = new Date(date.getTime() + (this.CHINA_TIMEZONE_OFFSET * 60 - date.getTimezoneOffset()) * 60000);
        return chinaTime.getHours();
    }
};

/**
 * 日志工具函数 - 统一处理日志格式和语言
 * 所有时间戳都转换为中国时区
 */
const logger = {
    info: (message, data = {}) => {
        console.log(message, typeof data === 'object' ? {
            时间戳: TimeZoneUtil.formatChinaTime(new Date()),
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
            时间戳: TimeZoneUtil.formatChinaTime(new Date())
        });
    }
};

/**
 * 键名翻译函数
 * 将英文键名转换为中文，便于日志阅读和理解
 */
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
        userMessage: '用户消息'
    };
    return translations[key] || key;
}

/**
 * Bot监控类
 * 负责处理所有监控和统计相关的功能
 */
class BotMonitor {
    constructor() {
        this.mongoUrl = process.env.MONGODB_URI;
        this.client = null;
        this.db = null;
        this.startTime = TimeZoneUtil.getChinaTime();
        this.messageCache = new Map();
        this.statsUpdateInterval = null;
        this.initialize();
    }

    /**
     * 判断是否为用户消息（非机器人消息）
     * @param {Object} message Telegram消息对象
     * @returns {boolean} 是否为用户消息
     */
    isUserMessage(message) {
        return message.from && !message.from.is_bot;
    }

    /**
     * 初始化数据库连接
     * 建立MongoDB连接并配置必要的索引
     */
    async initialize() {
        try {
            this.client = await MongoClient.connect(this.mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            this.db = this.client.db('bot_monitoring');

            // 创建必要的索引
            await Promise.all([
                this.db.collection('messages').createIndex({ timestamp: -1 }),
                this.db.collection('messages').createIndex({ userId: 1 }),
                this.db.collection('messages').createIndex({ "from.is_bot": 1 }),
                this.db.collection('daily_stats').createIndex({ date: 1 }, { unique: true }),
                this.db.collection('system_logs').createIndex({ timestamp: -1 })
            ]);

            const mongoUser = this.mongoUrl.split('@')[0].split('://')[1].split(':')[0];
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
     * 记录消息统计
     * 只统计用户发送的消息，排除机器人消息
     */
    async logMessage(message) {
        try {
            // 检查是否为用户消息
            if (!this.isUserMessage(message)) {
                return; // 如果是机器人消息，直接返回
            }

            const messageStats = {
                timestamp: TimeZoneUtil.getChinaTime(),
                userId: message.from.id,
                chatId: message.chat.id,
                messageType: message.text ? 'text' : 'other',
                command: message.text?.startsWith('/') ? message.text.split(' ')[0] : null,
                from: {
                    is_bot: message.from.is_bot,
                    username: message.from.username,
                    firstName: message.from.first_name,
                    lastName: message.from.last_name
                }
            };

            await this.db.collection('messages').insertOne(messageStats);
            await this.updateDailyStats();

            logger.info('用户消息已记录', {
                userId: message.from.id,
                messageType: messageStats.messageType,
                timestamp: TimeZoneUtil.formatChinaTime(messageStats.timestamp)
            });
        } catch (error) {
            logger.error('记录消息统计失败', error);
            await this.reconnectIfNeeded();
        }
    }

    /**
     * 更新每日统计数据
     * 只统计用户消息，使用中国时区
     */
    async updateDailyStats() {
        const today = TimeZoneUtil.getChinaToday();

        try {
            const stats = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today },
                        "from.is_bot": false // 只统计用户消息
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

            const dailyStats = {
                date: today,
                totalMessages: stats[0]?.totalMessages || 0,
                activeUsers: stats[0]?.uniqueUsers?.length || 0,
                commandsUsed: stats[0]?.commands || 0,
                lastUpdated: TimeZoneUtil.getChinaTime()
            };

            await this.db.collection('daily_stats').updateOne(
                { date: today },
                { $set: dailyStats },
                { upsert: true }
            );

            logger.info('每日统计数据已更新', {
                ...dailyStats,
                lastUpdated: TimeZoneUtil.formatChinaTime(dailyStats.lastUpdated)
            });

            return dailyStats;
        } catch (error) {
            logger.error('更新每日统计数据失败', error);
            return null;
        }
    }

    /**
     * 获取消息趋势
     * 按中国时区的小时统计消息数量
     */
    async getMessageTrend() {
        try {
            const today = TimeZoneUtil.getChinaToday();

            const trend = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today },
                        "from.is_bot": false // 只统计用户消息
                    }
                },
                {
                    $project: {
                        hour: {
                            $hour: {
                                $add: [
                                    "$timestamp",
                                    TimeZoneUtil.CHINA_TIMEZONE_OFFSET * 3600000 // 调整为中国时区
                                ]
                            }
                        },
                        userId: 1
                    }
                },
                {
                    $group: {
                        _id: "$hour",
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$userId" }
                    }
                },
                {
                    $sort: { "_id": 1 }
                }
            ]).toArray();

            // 填充24小时数据
            const fullTrend = Array.from({ length: 24 }, (_, i) => {
                const hourData = trend.find(t => t._id === i);
                return {
                    hour: i,
                    count: hourData?.count || 0,
                    uniqueUsers: hourData?.uniqueUsers?.length || 0,
                    time: `${String(i).padStart(2, '0')}:00`
                };
            });

            logger.info('消息趋势数据已获取', {
                totalHours: fullTrend.length,
                totalMessages: fullTrend.reduce((sum, hour) => sum + hour.count, 0)
            });

            return fullTrend;
        } catch (error) {
            logger.error('获取消息趋势失败', error);
            return [];
        }
    }

    /**
     * 获取系统状态
     * 所有时间使用中国时区
     */
    async getSystemStatus() {
        try {
            const now = TimeZoneUtil.getChinaTime();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            const recentMessages = await this.db.collection('messages').countDocuments({
                timestamp: { $gte: fiveMinutesAgo },
                "from.is_bot": false // 只统计用户消息
            });

            const mongoUser = this.mongoUrl.split('@')[0].split('://')[1].split(':')[0];
            const uptimeHours = (now - this.startTime) / (1000 * 60 * 60);

            const status = {
                status: recentMessages > 0 ? 'active' : 'idle',
                lastActivity: await this.db.collection('messages')
                    .findOne({ "from.is_bot": false }, { sort: { timestamp: -1 } })
                    .then(doc => doc ? TimeZoneUtil.formatChinaTime(doc.timestamp) : null),
                uptimeHours: Math.round(uptimeHours * 100) / 100,
                mongoUser,
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
     * 检查并重新连接数据库
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
     * 获取系统日志
     */
    async getSystemLogs(limit = 50) {
        try {
            const logs = await this.db.collection('system_logs')
                .find()
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();

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
     * 记录系统事件
     */
    async logSystemEvent(message, type = 'info', severity = 'low', details = {}) {
        try {
            const logEntry = {
                timestamp: TimeZoneUtil.getChinaTime(),
                type,
                message,
                severity,
                details
            };

            await this.db.collection('system_logs').insertOne(logEntry);
            logger.info('系统事件已记录', { type, message });
        } catch (error) {
            logger.error('记录系统事件失败', error);
        }
    }

    /**
     * 清理资源并关闭
     */
    async shutdown() {
        try {
            await this.logSystemEvent('监控系统关闭', 'shutdown', 'info');
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
            }

            // 清理缓存和定时器
            this.messageCache.clear();
            if (this.statsUpdateInterval) {
                clearInterval(this.statsUpdateInterval);
                this.statsUpdateInterval = null;
            }

            logger.info('监控系统已关闭');
        } catch (error) {
            logger.error('关闭监控系统时出错', error);
            throw error;
        }
    }

    /**
     * 获取用户统计信息
     * 只统计指定用户的非机器人消息
     */
    async getUserStats(userId) {
        try {
            const today = TimeZoneUtil.getChinaToday();

            const stats = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today },
                        userId: userId,
                        "from.is_bot": false
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

            // 格式化最后活跃时间为中国时区
            if (userStats.lastActive) {
                userStats.lastActive = TimeZoneUtil.formatChinaTime(userStats.lastActive);
            }

            return userStats;
        } catch (error) {
            logger.error('获取用户统计失败', error);
            return null;
        }
    }
}

// 创建监控系统单例
const monitor = new BotMonitor();

// 导出监控系统实例
export default monitor;