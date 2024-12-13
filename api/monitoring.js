// monitoring.js - Bot监控系统核心模块
import { MongoClient } from 'mongodb';

/**
 * 日志工具函数 - 统一处理日志格式和语言
 * 提供info和error两种日志级别
 * 自动进行中英文键名转换
 */
const logger = {
    // 信息级别日志
    info: (message, data = {}) => {
        console.log(message, typeof data === 'object' ? {
            时间戳: new Date().toISOString(),
            ...Object.entries(data).reduce((acc, [key, value]) => ({
                ...acc,
                [translateKey(key)]: value
            }), {})
        } : data);
    },
    // 错误级别日志
    error: (message, error) => {
        console.error(message, {
            错误信息: error.message,
            堆栈信息: error.stack,
            时间戳: new Date().toISOString()
        });
    }
};

/**
 * 键名翻译函数
 * 将英文键名转换为中文,便于日志阅读和理解
 * @param {string} key 需要转换的键名
 * @returns {string} 转换后的中文键名
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
        lastActive: '最后活跃时间'
    };
    return translations[key] || key;
}

/**
 * Bot监控类
 * 负责处理所有与监控和统计相关的功能
 * 包括消息记录、统计分析、状态监控等
 */
class BotMonitor {
    constructor() {
        // 初始化成员变量
        this.mongoUrl = process.env.MONGODB_URI;
        this.client = null;
        this.db = null;
        this.startTime = new Date(); // 记录启动时间
        this.messageCache = new Map(); // 消息缓存
        this.statsUpdateInterval = null; // 统计更新定时器
        this.initialize(); // 执行初始化
    }

    /**
     * 初始化数据库连接
     * 建立MongoDB连接并进行基本配置
     */
    async initialize() {
        try {
            // 连接数据库
            this.client = await MongoClient.connect(this.mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            this.db = this.client.db('bot_monitoring');

            // 提取MongoDB用户名用于日志
            const mongoUser = this.mongoUrl.split('@')[0].split('://')[1].split(':')[0];

            // 创建必要的索引
            await Promise.all([
                this.db.collection('messages').createIndex({ timestamp: -1 }),
                this.db.collection('messages').createIndex({ userId: 1 }),
                this.db.collection('daily_stats').createIndex({ date: 1 }, { unique: true }),
                this.db.collection('system_logs').createIndex({ timestamp: -1 })
            ]);

            logger.info('监控系统初始化成功', { mongoUser });
        } catch (error) {
            logger.error('监控系统初始化失败', error);
            throw error; // 向上传递错误,因为这是致命错误
        }
    }

    /**
     * 记录消息统计
     * 保存消息数据并更新相关统计信息
     * @param {Object} message Telegram消息对象
     */
    async logMessage(message) {
        try {
            // 构建消息统计数据
            const messageStats = {
                timestamp: new Date(),
                userId: message.from?.id,
                chatId: message.chat?.id,
                messageType: message.text ? 'text' : 'other',
                command: message.text?.startsWith('/') ? message.text.split(' ')[0] : null,
                metadata: {
                    username: message.from?.username,
                    firstName: message.from?.first_name,
                    lastName: message.from?.last_name
                }
            };

            // 保存消息数据
            await this.db.collection('messages').insertOne(messageStats);

            // 更新消息缓存
            this.updateMessageCache(messageStats);

            // 更新每日统计
            await this.updateDailyStats(messageStats);

            logger.info('消息统计已记录', { userId: message.from?.id });
        } catch (error) {
            logger.error('记录消息统计失败', error);
            // 尝试重新连接数据库
            await this.reconnectIfNeeded();
        }
    }

    /**
     * 更新消息缓存
     * 用于提高统计性能,减少数据库查询
     * @param {Object} messageData 消息数据
     */
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
        if (messageData.userId) {
            stats.uniqueUsers.add(messageData.userId);
        }
        if (messageData.command) {
            stats.commands++;
        }
        stats.lastUpdate = new Date();
    }

    /**
     * 更新每日统计数据
     * 聚合计算每日消息、用户、命令等统计信息
     */
    async updateDailyStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            // 使用聚合管道计算统计数据
            const stats = await this.db.collection('messages')
                .aggregate([
                    {
                        $match: {
                            timestamp: { $gte: today }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalMessages: { $sum: 1 },
                            uniqueUsers: { $addToSet: "$userId" },
                            commands: {
                                $sum: {
                                    $cond: [
                                        { $ne: ["$command", null] },
                                        1,
                                        0
                                    ]
                                }
                            },
                            messageTypes: {
                                $addToSet: "$messageType"
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
                messageTypes: stats[0]?.messageTypes || [],
                lastUpdated: new Date()
            };

            // 更新数据库
            await this.db.collection('daily_stats').updateOne(
                { date: today },
                { $set: dailyStats },
                { upsert: true }
            );

            logger.info('每日统计数据已更新', dailyStats);
            return dailyStats;
        } catch (error) {
            logger.error('更新每日统计数据失败', error);
            await this.reconnectIfNeeded();
            return null;
        }
    }

    /**
     * 获取用户统计信息
     * 统计特定用户的活动数据
     * @param {string|number} userId 用户ID
     */
    async getUserStats(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 聚合计算用户统计数据
            const userStats = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        userId: userId,
                        timestamp: { $gte: today }
                    }
                },
                {
                    $group: {
                        _id: null,
                        messageCount: { $sum: 1 },
                        commandCount: {
                            $sum: {
                                $cond: [{ $ne: ["$command", null] }, 1, 0]
                            }
                        },
                        lastActive: { $max: "$timestamp" },
                        messageTypes: { $addToSet: "$messageType" }
                    }
                }
            ]).toArray();

            const stats = userStats[0] || {
                messageCount: 0,
                commandCount: 0,
                lastActive: null,
                messageTypes: []
            };

            logger.info('获取用户统计数据', { userId, ...stats });
            return stats;
        } catch (error) {
            logger.error('获取用户统计失败', error);
            await this.reconnectIfNeeded();
            return null;
        }
    }

    /**
     * 获取系统状态
     * 包括运行状态、数据库连接、活动情况等
     */
    async getSystemStatus() {
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

            // 获取最近活动数据
            const recentMessages = await this.db.collection('messages')
                .countDocuments({ timestamp: { $gte: fiveMinutesAgo } });

            // 获取最后一条消息时间
            const lastMessage = await this.db.collection('messages')
                .findOne({}, { sort: { timestamp: -1 } });

            // 获取MongoDB连接信息
            const mongoUser = this.mongoUrl.split('@')[0].split('://')[1].split(':')[0];

            // 计算运行时间
            const uptimeHours = (now - this.startTime) / (1000 * 60 * 60);

            // 构建状态对象
            const status = {
                status: recentMessages > 0 ? 'active' : 'idle',
                lastActivity: lastMessage?.timestamp || null,
                uptimeHours: uptimeHours,
                mongoUser: mongoUser,
                mongoStatus: this.client?.topology?.isConnected() ? 'connected' : 'disconnected',
                lastUpdate: now,
                recentMessagesCount: recentMessages,
                cacheSize: this.messageCache.size
            };

            logger.info('系统状态已更新', status);
            return status;
        } catch (error) {
            logger.error('获取系统状态失败', error);
            await this.reconnectIfNeeded();
            return null;
        }
    }

    /**
     * 获取消息趋势数据
     * 按小时统计消息数量变化
     */
    async getMessageTrend() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 按小时聚合统计消息数据
            const trend = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today }
                    }
                },
                {
                    $group: {
                        _id: {
                            hour: { $hour: "$timestamp" }
                        },
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$userId" },
                        commands: {
                            $sum: {
                                $cond: [{ $ne: ["$command", null] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $sort: { "_id.hour": 1 }
                }
            ]).toArray();

            // 填充完整的24小时数据
            const fullTrend = Array.from({ length: 24 }, (_, i) => {
                const hourData = trend.find(t => t._id.hour === i);
                return {
                    hour: i,
                    count: hourData?.count || 0,
                    uniqueUsers: hourData?.uniqueUsers?.length || 0,
                    commands: hourData?.commands || 0,
                    time: `${String(i).padStart(2, '0')}:00`
                };
            });

            logger.info('消息趋势数据已获取', {
                dataPoints: fullTrend.length,
                totalMessages: fullTrend.reduce((sum, hour) => sum + hour.count, 0)
            });

            return fullTrend;
        } catch (error) {
            logger.error('获取消息趋势失败', error);
            await this.reconnectIfNeeded();
            return [];
        }
    }

    /**
     * 检查并重新连接数据库
     * 在发生错误时尝试恢复数据库连接
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
         * 清理过期缓存数据
         * 定期清理24小时前的缓存数据
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
     * 关闭监控系统
     * 清理资源并关闭数据库连接
     */
    async shutdown() {
        try {
            // 保存最后的统计数据
            await this.updateDailyStats();

            // 清除更新定时器
            if (this.statsUpdateInterval) {
                clearInterval(this.statsUpdateInterval);
                this.statsUpdateInterval = null;
            }

            // 清理缓存
            this.messageCache.clear();

            // 记录关闭事件
            await this.db.collection('system_logs').insertOne({
                timestamp: new Date(),
                type: 'shutdown',
                message: '监控系统正常关闭'
            });

            // 关闭数据库连接
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
            }

            logger.info('监控系统已关闭');
        } catch (error) {
            logger.error('关闭监控系统时出错', error);
            throw error;
        }
    }

    /**
     * 记录系统日志
     * @param {string} message 日志消息
     * @param {string} type 日志类型
     * @param {string} severity 严重程度
     * @param {Object} details 详细信息
     */
    async logSystemEvent(message, type = 'info', severity = 'low', details = {}) {
        try {
            const logEntry = {
                timestamp: new Date(),
                type,
                message,
                severity,
                details: {
                    ...details,
                    uptime: (new Date() - this.startTime) / 1000
                }
            };

            await this.db.collection('system_logs').insertOne(logEntry);
            logger.info('系统事件已记录', { type, message });
        } catch (error) {
            logger.error('记录系统事件失败', error);
        }
    }

    /**
     * 获取系统日志
     * @param {number} limit 返回的日志数量
     * @param {string} severity 日志级别过滤
     * @param {Date} startTime 开始时间
     * @param {Date} endTime 结束时间
     */
    async getSystemLogs(limit = 50, severity = null, startTime = null, endTime = null) {
        try {
            // 构建查询条件
            const query = {};
            if (severity) {
                query.severity = severity;
            }
            if (startTime || endTime) {
                query.timestamp = {};
                if (startTime) {
                    query.timestamp.$gte = startTime;
                }
                if (endTime) {
                    query.timestamp.$lte = endTime;
                }
            }

            // 查询日志
            const logs = await this.db.collection('system_logs')
                .find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();

            return logs.map(log => ({
                ...log,
                formattedTime: log.timestamp.toLocaleString()
            }));
        } catch (error) {
            logger.error('获取系统日志失败', error);
            return [];
        }
    }

    /**
     * 获取性能指标
     * 收集系统性能相关的统计数据
     */
    async getPerformanceMetrics() {
        try {
            const now = new Date();
            const metrics = {
                uptime: (now - this.startTime) / 1000,
                cacheSize: this.messageCache.size,
                dbConnection: this.client?.topology?.isConnected() || false,
                lastUpdate: now,
                messageStats: await this.getMessageStats(),
                systemLoad: {
                    heapUsed: process.memoryUsage().heapUsed,
                    heapTotal: process.memoryUsage().heapTotal,
                    external: process.memoryUsage().external,
                    cpu: process.cpuUsage()
                }
            };

            logger.info('性能指标已收集', metrics);
            return metrics;
        } catch (error) {
            logger.error('获取性能指标失败', error);
            return null;
        }
    }

    /**
     * 获取消息统计
     * 获取详细的消息统计信息
     */
    async getMessageStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const stats = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$userId" },
                        commandCount: {
                            $sum: {
                                $cond: [{ $ne: ["$command", null] }, 1, 0]
                            }
                        },
                        messageTypes: { $addToSet: "$messageType" }
                    }
                }
            ]).toArray();

            return {
                totalMessages: stats[0]?.totalCount || 0,
                uniqueUsers: stats[0]?.uniqueUsers?.length || 0,
                commandCount: stats[0]?.commandCount || 0,
                messageTypes: stats[0]?.messageTypes || [],
                averagePerHour: (stats[0]?.totalCount || 0) / (new Date().getHours() + 1)
            };
        } catch (error) {
            logger.error('获取消息统计失败', error);
            return null;
        }
    }
}

// 创建监控系统单例
const monitor = new BotMonitor();

// 导出监控系统实例
export default monitor;