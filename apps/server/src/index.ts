// apps/server/src/index.ts

// 导入必要的依赖和类型
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import telegramRoutes from './app/bot/telegram/routes';
import connectDatabase from './app/config/database';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
// 导入 moment-timezone 用于处理时区转换
import moment from 'moment-timezone';

// 设置系统默认时区为中国时区 (UTC+8)
moment.tz.setDefault('Asia/Shanghai');

// 定义数据库连接状态的接口类型
interface DbStatus {
    status: string;      // 连接状态的英文描述
    description: string; // 连接状态的中文描述
}

/**
 * 时间处理工具函数：将任何时间转换为中国时区并格式化
 * @param date - 需要格式化的日期，默认为当前时间
 * @returns 格式化后的时间字符串，包含时区信息
 */
const formatChineseTime = (date: Date = new Date()): string => {
    return moment(date)
        .tz('Asia/Shanghai')
        .format('YYYY-MM-DD HH:mm:ss [GMT+8]');
};

/**
 * 格式化服务器运行时间
 * @param seconds - 运行的秒数
 * @returns 格式化后的运行时间字符串，包含天、小时、分钟、秒
 */
const formatUptime = (seconds: number): string => {
    // 计算天数
    const days = Math.floor(seconds / (24 * 60 * 60));
    // 计算小时数
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    // 计算分钟数
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    // 计算剩余秒数
    const remainingSeconds = Math.floor(seconds % 60);

    // 组装时间字符串
    const parts = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}秒`);

    return parts.join(' ');
};

/**
 * 获取数据库连接状态信息
 * @returns 数据库状态信息对象
 */
const getDbStatus = (): DbStatus => {
    // 定义数据库所有可能的连接状态
    const statusMap: Record<number, DbStatus> = {
        [mongoose.ConnectionStates.disconnected]: {
            status: 'disconnected',
            description: '连接已断开'
        },
        [mongoose.ConnectionStates.connected]: {
            status: 'connected',
            description: '已连接'
        },
        [mongoose.ConnectionStates.connecting]: {
            status: 'connecting',
            description: '正在连接'
        },
        [mongoose.ConnectionStates.disconnecting]: {
            status: 'disconnecting',
            description: '正在断开连接'
        }
    };

    // 获取当前连接状态
    const state = mongoose.connection.readyState;

    // 返回状态信息，如果状态未知则返回默认值
    return statusMap[state] || {
        status: 'unknown',
        description: '未知状态'
    };
};

/**
 * 获取完整的数据库状态信息
 * @returns 包含连接状态、主机名、数据库名和最后连接时间的状态信息
 */
const getFullDbStatus = () => {
    const basicStatus = getDbStatus();
    return {
        ...basicStatus,
        host: mongoose.connection.host || '未连接',
        name: mongoose.connection.name || '未指定',
        lastConnectedTime: mongoose.connection.readyState === mongoose.ConnectionStates.connected
            ? formatChineseTime(new Date())
            : '未连接'
    };
};

// 加载环境变量配置
dotenv.config();

// 创建 Express 应用实例
const app = express();

// 配置全局中间件
app.use(cors());                    // 启用跨域资源共享
app.use(express.json());           // 解析 JSON 请求体

// 添加请求日志中间件，记录所有请求的时间和路径
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${formatChineseTime()}] ${req.method} ${req.path}`);
    next();
});

// 健康检查路由
app.get('/health', (req: Request, res: Response) => {
    // 收集当前服务器状态信息
    const serverStatus = {
        status: 'ok',
        currentTime: formatChineseTime(),
        server: {
            uptime: formatUptime(process.uptime()),
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            platform: process.platform
        },
        database: getFullDbStatus()
    };

    // 返回状态信息
    res.json(serverStatus);
});

// 注册 Telegram bot 相关路由
app.use('/api/bot/telegram', telegramRoutes);

// 全局错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // 记录错误信息
    console.error('全局错误:', err);

    // 返回适当的错误响应
    res.status(500).json({
        ok: false,
        description: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
});

// 获取服务器端口配置
const port = process.env.PORT || 3001;

/**
 * 启动服务器和数据库连接
 * 处理不同环境下的服务器启动逻辑
 */
const startServer = async () => {
    try {
        // 连接数据库
        await connectDatabase();

        // 根据运行环境决定启动方式
        if (process.env.VERCEL) {
            // Vercel 环境下导出应用实例
            module.exports = app;
        } else {
            // 本地环境启动 HTTP 服务器
            app.listen(port, () => {
                console.log(`服务器已启动: http://localhost:${port}`);
                console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
            });
        }
    } catch (error) {
        // 错误处理
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
};

// 启动服务器
startServer();

// 导出应用实例（用于测试和其他模块引用）
export default app;