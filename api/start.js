import { MongoClient } from 'mongodb';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('bot_monitoring');

        // 获取今天的开始时间
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 并行获取所有需要的数据
        const [dailyStats, recentFeedback, systemLogs, messageHistory] = await Promise.all([
            // 获取今日统计
            db.collection('daily_stats').findOne({ date: today }),

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

        const systemStatus = {
            status: recentMessages > 0 ? 'active' : 'idle',
            uptimeHours: process.uptime() / 3600
        };

        // 关闭数据库连接
        await client.close();

        // 返回所有数据
        return response.status(200).json({
            dailyStats: dailyStats || {
                totalMessages: 0,
                uniqueUsers: 0,
                commands: 0
            },
            systemStatus,
            recentFeedback,
            systemLogs: systemLogs.map(log => ({
                timestamp: log.timestamp,
                message: log.message
            })),
            messageHistory: messageHistory.map(item => ({
                hour: item._id,
                count: item.count
            }))
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        return response.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}