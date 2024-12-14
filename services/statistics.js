// services/statistics.js
import { logger } from './logger.js';
import { dbManager } from '../api/database.js';
import { MessageType, DataModels } from '../api/types.js';

class StatisticsService {
    constructor() {
        this.dailyStats = {
            date: new Date().toISOString().split('T')[0],
            messageCount: 0,
            commandCount: 0,
            activeUsers: new Set(),
            messageTypes: new Map(),
            hourlyDistribution: new Array(24).fill(0)
        };

        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            const db = await dbManager.connect();
            await db.createCollection('statistics');
            await db.createCollection('user_analytics');

            await db.collection('statistics').createIndex({ date: 1 });
            await db.collection('user_analytics').createIndex({ userId: 1 });

            this.initialized = true;
            logger.info('统计服务初始化成功');
        } catch (error) {
            logger.error('统计服务初始化失败', error);
            throw error;
        }
    }

    recordMessage(message, userId, messageType = MessageType.TEXT) {
        this.dailyStats.messageCount++;
        this.dailyStats.activeUsers.add(userId);

        const currentTypeCount = this.dailyStats.messageTypes.get(messageType) || 0;
        this.dailyStats.messageTypes.set(messageType, currentTypeCount + 1);

        const hour = new Date().getHours();
        this.dailyStats.hourlyDistribution[hour]++;

        if (messageType === MessageType.COMMAND) {
            this.dailyStats.commandCount++;
        }
    }

    async saveDailyStats() {
        try {
            const stats = {
                date: this.dailyStats.date,
                totalMessages: this.dailyStats.messageCount,
                totalCommands: this.dailyStats.commandCount,
                activeUsers: this.dailyStats.activeUsers.size,
                messageTypes: Object.fromEntries(this.dailyStats.messageTypes),
                hourlyDistribution: this.dailyStats.hourlyDistribution,
                timestamp: new Date()
            };

            DataModels.Stats.validate(stats);

            const collection = await dbManager.getCollection('statistics');
            await collection.updateOne(
                { date: stats.date },
                { $set: stats },
                { upsert: true }
            );

            logger.info('每日统计数据已保存', { date: stats.date });
        } catch (error) {
            logger.error('保存每日统计数据失败', error);
            throw error;
        }
    }

    async getDailyStats(date = null) {
        try {
            if (!date) {
                return {
                    总消息数: this.dailyStats.messageCount,
                    命令使用数: this.dailyStats.commandCount,
                    活跃用户数: this.dailyStats.activeUsers.size,
                    消息类型分布: Object.fromEntries(this.dailyStats.messageTypes),
                    小时分布: this.dailyStats.hourlyDistribution
                };
            }

            const collection = await dbManager.getCollection('statistics');
            const stats = await collection.findOne({ date });

            if (!stats) {
                return null;
            }

            return {
                总消息数: stats.totalMessages,
                命令使用数: stats.totalCommands,
                活跃用户数: stats.activeUsers,
                消息类型分布: stats.messageTypes,
                小时分布: stats.hourlyDistribution
            };
        } catch (error) {
            logger.error('获取每日统计数据失败', error);
            throw error;
        }
    }

    async getHistoricalStats(days = 7) {
        try {
            const collection = await dbManager.getCollection('statistics');
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const stats = await collection
                .find({
                    date: {
                        $gte: startDate.toISOString().split('T')[0],
                        $lte: endDate.toISOString().split('T')[0]
                    }
                })
                .sort({ date: 1 })
                .toArray();

            return stats.map(stat => ({
                日期: stat.date,
                总消息数: stat.totalMessages,
                活跃用户数: stat.activeUsers,
                命令使用数: stat.totalCommands
            }));
        } catch (error) {
            logger.error('获取历史统计数据失败', error);
            throw error;
        }
    }

    resetDailyStats() {
        this.dailyStats = {
            date: new Date().toISOString().split('T')[0],
            messageCount: 0,
            commandCount: 0,
            activeUsers: new Set(),
            messageTypes: new Map(),
            hourlyDistribution: new Array(24).fill(0)
        };
        logger.info('每日统计数据已重置');
    }
}

const statisticsService = new StatisticsService();
export { statisticsService };