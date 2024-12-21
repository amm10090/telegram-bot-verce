// apps/server/src/config/database.ts

import mongoose from 'mongoose';

/**
 * 数据库连接配置
 */
const connectDatabase = async (): Promise<void> => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bot';

        // 设置 Mongoose 连接选项
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as mongoose.ConnectOptions;

        // 连接数据库
        await mongoose.connect(MONGODB_URI, options);
        console.log('MongoDB 连接成功');

        // 监听数据库连接事件
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB 连接错误:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB 连接断开');
        });

        // 优雅关闭数据库连接
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB 连接已关闭');
                process.exit(0);
            } catch (err) {
                console.error('关闭 MongoDB 连接时出错:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('连接 MongoDB 失败:', error);
        process.exit(1);
    }
};

export default connectDatabase;