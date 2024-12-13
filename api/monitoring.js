// monitoring.js - Telegram Bot 监控系统核心模块
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

/**
 * 时区处理工具类
 * 处理所有与时区转换相关的操作，统一使用中国时区(UTC+8)
 */
const TimeZoneUtil = {
    // 中国时区偏移量（小时）
    CHINA_TIMEZONE_OFFSET: 8,

    // 转换任意时间到中国时区
    toChinaTime(date) {
        if (!date) return null;
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * this.CHINA_TIMEZONE_OFFSET));
    },

    // 获取中国时区的今天开始时间
    getChinaDayStart() {
        const now = this.toChinaTime(new Date());
        now.setHours(0, 0, 0, 0);
        // 转回 UTC 时间用于数据库查询
        return new Date(now.getTime() - (this.CHINA_TIMEZONE_OFFSET * 60 * 60 * 1000));
    },

    // 格式化为易读的中国时间格式
    formatChinaTime(date) {
        if (!date) return null;
        const chinaTime = this.toChinaTime(date);
        return chinaTime.toISOString().replace('T', ' ').substring(0, 19);
    }
};

/**
 * 日志工具类
 * 统一处理日志格式和输出
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
 * 统一的键名中英转换
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
        userMessage: '用户消息',
        totalMessages: '总消息数',
        activeUsers: '活跃用户数',
        commandsUsed: '命令使用数',
        updateTime: '更新时间',
        deployment: '部署',
        vercelLogs: 'Vercel日志'
    };
    return translations[key] || key;
}

/**
 * Bot 监控系统核心类
 */
class BotMonitor {
    constructor() {
        // 基础配置
        this.mongoUrl = process.env.MONGODB_URI;
        this.vercelProjectId = process.env.VERCEL_PROJECT_ID;
        this.vercelToken = process.env.VERCEL_TOKEN;

        // 运行时变量
        this.client = null;
        this.db = null;
        this.startTime = TimeZoneUtil.toChinaTime(new Date());
        this.messageCache = new Map();
        this.statsUpdateInterval = null;

        // 初始化系统
        this.initialize();
    }

    /**
     * 系统初始化
     * 建立数据库连接并设置必要的索引
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

            // 创建索引
            await Promise.all([
                this.db.collection('messages').createIndex({ timestamp: -1 }),
                this.db.collection('messages').createIndex({ userId: 1 }),
                this.db.collection('messages').createIndex({ messageId: 1 }, { unique: true }),
                this.db.collection('messages').createIndex({ isUserMessage: 1 }),
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
     * 判断是否为用户消息
     * 严格区分用户消息和机器人消息
     */
    isUserMessage(message) {
        if (!message?.from || message.from.is_bot) {
            return false;
        }

        // 处理命令消息
        if (message.text?.startsWith('/')) {
            return !message.from.is_bot;
        }

        // 处理普通消息
        if (message.text) {
            return message.from.id && !message.from.is_bot;
        }

        return false;
    }

    /**
     * 记录消息统计
     * 只统计用户发送的消息，包含去重逻辑
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

            // 消息去重检查
            const messageId = message.message_id || message.update_id;
            const existingMessage = await this.db.collection('messages').findOne({ messageId });

            if (existingMessage) {
                logger.info('跳过重复消息', { messageId });
                return;
            }

            // 构建消息数据
            const messageStats = {
                messageId,
                timestamp: TimeZoneUtil.toChinaTime(new Date()),
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

            logger.info('用户消息已记录', {
                userId: message.from.id,
                type: messageStats.messageType,
                timestamp: TimeZoneUtil.formatChinaTime(messageStats.timestamp)
            });
        } catch (error) {
            logger.error('记录消息统计失败', error);
            await this.reconnectIfNeeded();
        }
    }

    /**
     * 更新每日统计数据
     * 使用正确的时区计算
     */
    async updateDailyStats() {
        try {
            const dayStart = TimeZoneUtil.getChinaDayStart();
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            // 聚合计算统计数据
            const stats = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: dayStart, $lt: dayEnd },
                        isUserMessage: true
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalMessages: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$userId" },
                        commands: {
                            $sum: { $cond: [{ $ne: ["$command", null] }, 1, 0] }
                        }
                    }
                }
            ]).toArray();

            // 构建统计数据
            const dailyStats = {
                date: dayStart,
                totalMessages: stats[0]?.totalMessages || 0,
                activeUsers: stats[0]?.uniqueUsers?.length || 0,
                commandsUsed: stats[0]?.commands || 0,
                lastUpdated: TimeZoneUtil.toChinaTime(new Date())
            };

            // 更新数据库
            await this.db.collection('daily_stats').updateOne(
                { date: dayStart },
                { $set: dailyStats },
                { upsert: true }
            );

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
     * 获取消息趋势数据
     * 按小时统计用户消息数量，使用中国时区
     */
    async getMessageTrend() {
        try {
            const dayStart = TimeZoneUtil.getChinaDayStart();
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            // 聚合计算小时统计
            const trend = await this.db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: dayStart, $lt: dayEnd },
                        isUserMessage: true
                    }
                },
                {
                    $addFields: {
                        chinaHour: {
                            $add: [
                                { $hour: "$timestamp" },
                                TimeZoneUtil.CHINA_TIMEZONE_OFFSET
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$chinaHour",
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$userId" }
                    }
                },
                {
                    $sort: { "_id": 1 }
                }
            ]).toArray();

            // 填充完整24小时数据
            const fullTrend = Array.from({ length: 24 }, (_, i) => {
                const hourData = trend.find(t => t._id === i);
                return {
                    hour: i,
                    count: hourData?.count || 0,
                    uniqueUsers: hourData?.uniqueUsers?.length || 0,
                    time: `${String(i).padStart(2, '0')}:00`
                };
            });

            return fullTrend;
        } catch (error) {
            logger.error('获取消息趋势失败', error);
            return [];
        }
    }

    /**
     * 获取系统状态
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

            // 获取数据库信息
            const mongoUser = this.mongoUrl.split('@')[0].split('://')[1].split(':')[0];
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
         * 获取 Vercel 项目日志
         * 获取项目部署和运行时的详细日志信息
         */
    async getVercelLogs(limit = 50) {
        try {
            // 检查配置
            if (!this.vercelProjectId || !this.vercelToken) {
                throw new Error('缺少 Vercel 配置');
            }

            // 获取部署列表
            const deploymentsResponse = await fetch(
                `https://api.vercel.com/v6/deployments?projectId=${this.vercelProjectId}&limit=5`,
                {
                    headers: {
                        Authorization: `Bearer ${this.vercelToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!deploymentsResponse.ok) {
                throw new Error(`获取部署列表失败: ${deploymentsResponse.status}`);
            }

            const deployments = await deploymentsResponse.json();

            // 获取最近的部署ID
            const recentDeploymentIds = deployments.deployments
                .map(d => d.uid)
                .slice(0, 3);  // 获取最近3次部署的日志

            // 并行获取所有部署的日志
            const logsPromises = recentDeploymentIds.map(async (deploymentId) => {
                const response = await fetch(
                    `https://api.vercel.com/v6/deployments/${deploymentId}/events`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.vercelToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    logger.error(`获取部署 ${deploymentId} 的日志失败`, {
                        status: response.status
                    });
                    return [];
                }

                const data = await response.json();
                return data.events || [];
            });

            // 等待所有日志获取完成
            const allLogs = await Promise.all(logsPromises);

            // 合并所有日志并按时间排序
            const mergedLogs = allLogs
                .flat()
                .map(event => ({
                    timestamp: TimeZoneUtil.formatChinaTime(new Date(event.createdAt)),
                    type: event.type,
                    message: event.message || event.text || '无消息内容',
                    status: event.status || 'unknown',
                    deployment: event.deploymentId,
                    details: {
                        region: event.region || 'unknown',
                        payload: event.payload || {},
                        source: event.source || 'system'
                    }
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);

            // 记录系统事件
            await this.logSystemEvent('已获取Vercel日志', 'info', 'low', {
                deploymentsCount: recentDeploymentIds.length,
                logsCount: mergedLogs.length
            });

            return mergedLogs;

        } catch (error) {
            logger.error('获取 Vercel 日志失败', error);
            // 记录错误事件
            await this.logSystemEvent('获取Vercel日志失败', 'error', 'high', {
                error: error.message,
                projectId: this.vercelProjectId
            });
            return [];
        }
    }

    /**
     * 获取最新部署状态
     * 获取项目最新的部署信息和状态
     */
    async getLatestDeployment() {
        try {
            if (!this.vercelProjectId || !this.vercelToken) {
                throw new Error('缺少 Vercel 配置');
            }

            const response = await fetch(
                `https://api.vercel.com/v6/deployments?projectId=${this.vercelProjectId}&limit=1`,
                {
                    headers: {
                        Authorization: `Bearer ${this.vercelToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`获取部署信息失败: ${response.status}`);
            }

            const data = await response.json();
            const latestDeployment = data.deployments[0];

            if (!latestDeployment) {
                return null;
            }

            return {
                id: latestDeployment.uid,
                url: latestDeployment.url,
                status: latestDeployment.state,
                createdAt: TimeZoneUtil.formatChinaTime(new Date(latestDeployment.created)),
                ready: latestDeployment.ready,
                environment: latestDeployment.target || 'production',
                branch: latestDeployment.meta?.branch || 'unknown'
            };

        } catch (error) {
            logger.error('获取最新部署状态失败', error);
            return null;
        }
    }

    /**
     * 记录系统性能指标
     * 定期记录系统的性能数据
     */
    async logPerformanceMetrics() {
        try {
            const metrics = {
                timestamp: TimeZoneUtil.toChinaTime(new Date()),
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                mongoStatus: this.client?.topology?.isConnected() ? 'connected' : 'disconnected',
                cacheSize: this.messageCache.size
            };

            await this.db.collection('performance_metrics').insertOne(metrics);

            // 清理30天前的性能数据
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            await this.db.collection('performance_metrics').deleteMany({
                timestamp: { $lt: thirtyDaysAgo }
            });

            logger.info('性能指标已记录', metrics);
        } catch (error) {
            logger.error('记录性能指标失败', error);
        }
    }

    /**
     * 获取系统概览
     * 获取系统整体运行状况的摘要信息
     */
    async getSystemOverview() {
        try {
            const now = TimeZoneUtil.toChinaTime(new Date());
            const dayStart = TimeZoneUtil.getChinaDayStart();
            const [
                dailyStats,
                latestDeployment,
                performanceMetrics
            ] = await Promise.all([
                this.updateDailyStats(),
                this.getLatestDeployment(),
                this.db.collection('performance_metrics')
                    .findOne({}, { sort: { timestamp: -1 } })
            ]);

            return {
                status: {
                    uptime: Math.round((now - this.startTime) / 1000 / 60 / 60 * 100) / 100,
                    lastUpdate: TimeZoneUtil.formatChinaTime(now),
                    mongoStatus: this.client?.topology?.isConnected() ? 'connected' : 'disconnected'
                },
                dailyStats: {
                    messages: dailyStats?.totalMessages || 0,
                    users: dailyStats?.activeUsers || 0,
                    commands: dailyStats?.commandsUsed || 0
                },
                deployment: latestDeployment,
                performance: performanceMetrics ? {
                    memoryUsage: Math.round(performanceMetrics.memory.heapUsed / 1024 / 1024 * 100) / 100,
                    uptime: Math.round(performanceMetrics.uptime / 60 / 60 * 100) / 100
                } : null
            };
        } catch (error) {
            logger.error('获取系统概览失败', error);
            return null;
        }
    }
}

// 创建监控系统单例
const monitor = new BotMonitor();

// 导出监控系统实例
export default monitor;