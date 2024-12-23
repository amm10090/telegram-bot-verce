// apps/server/src/index.ts

import express, {
    Express,
    Request,
    Response,
    NextFunction,
    Application
} from 'express';
import cors, { CorsOptions } from 'cors';
import telegramRoutes from './app/bot/telegram/routes';
import connectDatabase from './app/config/database';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { healthCheckService } from './health-check.service';

// 设置系统默认时区
moment.tz.setDefault('Asia/Shanghai');

// 接口定义部分
interface DbStatus {
    status: string;
    description: string;
}

interface FullDbStatus extends DbStatus {
    host: string;
    name: string;
    lastConnectedTime: string;
}

// 工具函数：时间格式化
const formatChineseTime = (date: Date = new Date()): string => {
    return moment(date)
        .tz('Asia/Shanghai')
        .format('YYYY-MM-DD HH:mm:ss [GMT+8]');
};

// 工具函数：运行时间格式化
const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}秒`);

    return parts.join(' ');
};

// 数据库状态检查函数
const getDbStatus = (): DbStatus => {
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

    const state = mongoose.connection.readyState;
    return statusMap[state] || {
        status: 'unknown',
        description: '未知状态'
    };
};

// 获取完整数据库状态
const getFullDbStatus = (): FullDbStatus => {
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

// 加载环境变量
dotenv.config();

// 创建 Express 应用实例（添加类型注释）
const app: Express = express();

// CORS 配置（添加类型注释）
const corsOptions: CorsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

// 中间件配置
app.use(cors(corsOptions));
app.use(express.json());

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction): void => {
    console.log(`[${formatChineseTime()}] ${req.method} ${req.path}`);
    next();
});

// 健康检查路由
app.get('/health', async (req: Request, res: Response): Promise<void> => {
    try {
        const healthStatus = await healthCheckService.getFullHealthStatus();
        const statusCode = healthStatus.status === 'healthy' ? 200
            : healthStatus.status === 'degraded' ? 200
                : 503;

        res.status(statusCode).json(healthStatus);
    } catch (error) {
        console.error('健康检查失败:', error);
        res.status(500).json({
            status: 'error',
            timestamp: moment().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss.SSS [GMT+8]'),
            error: '健康检查执行失败'
        });
    }
});

// 注册路由
app.use('/api/bot/telegram', telegramRoutes);

// 全局错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('全局错误:', err);
    res.status(500).json({
        ok: false,
        description: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
});

const port: number = Number(process.env.PORT) || 3000;

// 服务器启动函数
const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();

        if (process.env.VERCEL) {
            module.exports = app;
        } else {
            app.listen(port, () => {
                console.log(`服务器已启动: http://localhost:${port}`);
                console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
            });
        }
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
};

// 启动服务器
startServer();

export default app;