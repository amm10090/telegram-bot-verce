// start.js

import { MongoClient } from 'mongodb';

// 日志工具函数
const logger = {
    info: (message, data = {}) => {
        console.log(message, {
            时间戳: new Date().toISOString(),
            ...data
        });
    },
    error: (message, error) => {
        console.error(message, {
            错误信息: error.message,
            堆栈信息: error.stack,
            时间戳: new Date().toISOString()
        });
    }
};

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: '不支持的请求方法' });
    }

    try {
        logger.info('开始获取统计数据');
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('bot_monitoring');

        // 获取今天的开始时间
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 并行获取所有需要的数据
        const [dailyStats, recentFeedback, systemLogs, messageHistory] = await Promise.all([
            // 获取今日统计 - 使用聚合管道
            db.collection('messages').aggregate([
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
                        commandsUsed: {
                            $sum: {
                                $cond: [{ $ne: ["$command", null] }, 1, 0]
                            }
                        }
                    }
                }
            ]).toArray().then(results => results[0] || {
                totalMessages: 0,
                uniqueUsers: [],
                commandsUsed: 0
            }),

            // 获取最近反馈
            db.collection('feedback')
                .find()
                .sort({ timestamp: -1 })
                .limit(5)
                .toArray(),

            // 获取最近系统日志
            db.collection('system_logs')
                .find()
                .sort({ timestamp: -1 })
                .limit(50)
                .toArray(),

            // 获取今日消息历史（按小时统计）
            db.collection('messages').aggregate([
                {
                    $match: {
                        timestamp: { $gte: today }
                    }
                },
                {
                    $group: {
                        _id: { $hour: "$timestamp" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray()
        ]);

        // 获取系统状态
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentMessages = await db.collection('messages')
            .countDocuments({ timestamp: { $gte: fiveMinutesAgo } });

        // 获取MongoDB用户信息
        const mongoUser = process.env.MONGODB_URI.split('@')[0].split('://')[1].split(':')[0];

        const systemStatus = {
            status: recentMessages > 0 ? '活跃' : '空闲',
            uptimeHours: process.uptime() / 3600,
            mongoUser: mongoUser,
            mongoStatus: client.topology.isConnected() ? '已连接' : '未连接',
            lastUpdate: new Date().toISOString()
        };

        // 关闭数据库连接
        await client.close();
        logger.info('统计数据获取完成');

        // 填充空小时数据
        const fullMessageHistory = Array.from({ length: 24 }, (_, i) => {
            const hourData = messageHistory.find(m => m._id === i);
            return {
                小时: i,
                数量: hourData?.count || 0
            };
        });

        // 返回所有数据
        return response.status(200).json({
            dailyStats: {
                总消息数: dailyStats.totalMessages,
                活跃用户数: dailyStats.uniqueUsers.length,
                命令使用数: dailyStats.commandsUsed
            },
            systemStatus,
            recentFeedback,
            systemLogs: systemLogs.map(log => ({
                时间戳: log.timestamp,
                消息: log.message
            })),
            messageHistory: fullMessageHistory
        });

    } catch (error) {
        logger.error('统计API错误', error);
        return response.status(500).json({
            error: '服务器内部错误',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}