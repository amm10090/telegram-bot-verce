// monitoring.js

import { MongoClient } from 'mongodb';

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
            console.log('Monitoring system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize monitoring system:', error);
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
        } catch (error) {
            console.error('Error logging message:', error);
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
        } catch (error) {
            console.error('Error updating daily stats:', error);
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
        } catch (error) {
            console.error('Error logging feedback:', error);
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
        } catch (error) {
            console.error('Error logging system event:', error);
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

            return {
                dailyStats,
                recentFeedback,
                systemStatus
            };
        } catch (error) {
            console.error('Error getting real-time stats:', error);
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

            return {
                status: recentMessages > 0 ? 'active' : 'idle',
                lastActivity: await this.db.collection('messages')
                    .findOne({}, { sort: { timestamp: -1 } })
                    .then(doc => doc?.timestamp),
                uptimeHours: process.uptime() / 3600
            };
        } catch (error) {
            console.error('Error getting system status:', error);
            return null;
        }
    }
}

// 创建监控系统单例
const monitor = new BotMonitor();
export default monitor;