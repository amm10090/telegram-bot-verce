// monitoring.js

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

// 键名翻译函数
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
        uptimeHours: '运行时间(小时)'
    };
    return translations[key] || key;
}

class BotMonitor {
    constructor() {
        // 初始化 MongoDB 连接
        this.mongoUrl = process.env.MONGODB_URI;
        this.client = null;
        this.db = null;
        this.initialize();
    }

    // 初始化数据库连接
    async initialize() {
        try {
            this.client = await MongoClient.connect(this.mongoUrl);
            this.db = this.client.db('bot_monitoring');
            logger.info('监控系统初始化成功');
        } catch (error) {
            logger.error('监控系统初始化失败', error);
        }
    }

    // 记录消息统计
    async logMessage(message) {
        try {
            const messageStats = {
                timestamp: new Date(),
                userId: message.from.id,
                chatId: message.chat.id,
                messageType: message.text ? 'text' : 'other',
                command: message.text?.startsWith('/') ? message.text.split(' ')[0] : null
            };

            await this.db.collection('messages').insertOne(messageStats);
            await this.updateDailyStats();
            logger.info('消息统计已记录', { userId: message.from.id });
        } catch (error) {
            logger.error('记录消息统计失败', error);
        }
    }

    // 更新每日统计数据
    async updateDailyStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            const stats = await this.db.collection('messages')
                .aggregate([
                    { $match: { timestamp: { $gte: today } } },
                    {
                        $group: {
                            _id: null,
                            totalMessages: { $sum: 1 },
                            uniqueUsers: { $addToSet: "$userId" },
                            commands: { $sum: { $cond: [{ $ne: ["$command", null] }, 1, 0] } }
                        }
                    }
                ]).toArray();

            const dailyStats = {
                date: today,
                totalMessages: stats[0]?.totalMessages || 0,
                activeUsers: stats[0]?.uniqueUsers?.length || 0,
                commandsUsed: stats[0]?.commands || 0,
                lastUpdated: new Date()
            };

            await this.db.collection('daily_stats').updateOne(
                { date: today },
                { $set: dailyStats },
                { upsert: true }
            );
            logger.info('每日统计数据已更新', dailyStats);
        } catch (error) {
            logger.error('更新每日统计数据失败', error);
        }
    }

    // 记录用户反馈
    async logFeedback(feedback) {
        try {
            const feedbackDoc = {
                timestamp: new Date(),
                userId: feedback.userId,
                rating: feedback.rating,
                comment: feedback.comment,
                resolved: false
            };

            await this.db.collection('feedback').insertOne(feedbackDoc);
            logger.info('用户反馈已记录', { userId: feedback.userId });
        } catch (error) {
            logger.error('记录用户反馈失败', error);
        }
    }

    // 记录系统日志
    async logSystemEvent(event) {
        try {
            const logEntry = {
                timestamp: new Date(),
                type: event.type,
                message: event.message,
                details: event.details || {},
                severity: event.severity || 'info'
            };

            await this.db.collection('system_logs').insertOne(logEntry);
            logger.info('系统事件已记录', { type: event.type });
        } catch (error) {
            logger.error('记录系统事件失败', error);
        }
    }

    // 获取实时统计数据
    async getRealTimeStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [dailyStats, recentFeedback, systemStatus] = await Promise.all([
                this.db.collection('daily_stats').findOne({ date: today }),
                this.db.collection('feedback')
                    .find({})
                    .sort({ timestamp: -1 })
                    .limit(5)
                    .toArray(),
                this.getSystemStatus()
            ]);

            logger.info('已获取实时统计数据');
            return {
                dailyStats,
                recentFeedback,
                systemStatus
            };
        } catch (error) {
            logger.error('获取实时统计数据失败', error);
            return null;
        }
    }

    // 获取系统状态
    async getSystemStatus() {
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

            const recentMessages = await this.db.collection('messages')
                .countDocuments({ timestamp: { $gte: fiveMinutesAgo } });

            const status = {
                status: recentMessages > 0 ? 'active' : 'idle',
                lastActivity: await this.db.collection('messages')
                    .findOne({}, { sort: { timestamp: -1 } })
                    .then(doc => doc?.timestamp),
                uptimeHours: process.uptime() / 3600
            };

            logger.info('已获取系统状态', status);
            return status;
        } catch (error) {
            logger.error('获取系统状态失败', error);
            return null;
        }
    }
}

// 创建监控系统单例
const monitor = new BotMonitor();
export default monitor;