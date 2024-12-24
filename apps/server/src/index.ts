// apps/server/src/index.ts

/**
 * 核心依赖导入
 * 包含 Express 框架及其类型定义、中间件和工具库
 */
import express, {
    Application,
    NextFunction,
    Request,
    Response
} from 'express';
import { CorsOptions } from 'cors';
import cors from 'cors';
import { ExtendedRequest, ExtendedResponse, HttpStatus, Middleware, RequestHandler, ErrorHandler } from './types/express';
import telegramRoutes from './app/bot/telegram/routes';
import connectDatabase from './app/config/database';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { healthCheckService } from './health-check.service';

/**
 * 时区配置
 * 将系统默认时区设置为中国时区(UTC+8)，确保整个应用使用统一的时区标准
 */
moment.tz.setDefault('Asia/Shanghai');

/**
 * 格式化时间为中国时区
 * @param date 待格式化的日期，默认为当前时间
 * @returns 格式化后的时间字符串，包含时区信息
 */
const formatChineseTime = (date: Date = new Date()): string => {
    return moment(date)
        .tz('Asia/Shanghai')
        .format('YYYY-MM-DD HH:mm:ss [GMT+8]');
};

/**
 * 格式化运行时间
 * @param seconds 运行的总秒数
 * @returns 人类可读的运行时间格式
 */
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

/**
 * 数据库状态信息接口定义
 */
interface StatusInfo {
    status: string;
    description: string;
}

/**
 * 获取数据库连接状态
 * @returns 数据库当前状态信息
 */
const getDbStatus = (): StatusInfo => {
    const statusMap: Record<number, StatusInfo> = {
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

/**
 * 获取完整的数据库状态信息
 * @returns 包含连接状态、主机信息和最后连接时间的详细状态
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
const app: Application = express();

/**
 * CORS 配置选项
 * 定义允许的源、HTTP 方法和请求头
 */
const corsOptions: CorsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

// 配置全局中间件
app.use(cors(corsOptions) as unknown as Middleware);
app.use(express.json() as unknown as Middleware);

/**
 * 请求日志中间件
 * 记录所有进入的 HTTP 请求的方法和路径
 */
const requestLogger: RequestHandler = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): void => {
    const requestMethod = req.method;
    const requestPath = req.originalUrl || req.url;
    console.log(`[${formatChineseTime()}] ${requestMethod} ${requestPath}`);
    next();
};

// 应用请求日志中间件
app.use(requestLogger as unknown as Middleware);

/**
 * 健康检查处理器
 * 提供系统的健康状态信息，包括数据库连接状态
 */
const healthCheckHandler: RequestHandler = async (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): Promise<void> => {
    try {
        const healthStatus = await healthCheckService.getFullHealthStatus();
        const statusCode = healthStatus.status === 'healthy' ? HttpStatus.OK
            : healthStatus.status === 'degraded' ? HttpStatus.OK
                : HttpStatus.INTERNAL_SERVER_ERROR;

        res.status(statusCode).json(healthStatus);
    } catch (error) {
        console.error('健康检查失败:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            timestamp: moment().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss.SSS [GMT+8]'),
            error: '健康检查执行失败'
        });
    }
};

// 注册路由
app.get('/health', healthCheckHandler as unknown as RequestHandler);
app.use('/api/bot/telegram', telegramRoutes);

/**
 * 全局错误处理中间件
 * 统一处理未被捕获的错误，提供适当的错误响应
 */
const errorHandler: ErrorHandler = (
    error: Error,
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): void => {
    console.error('全局错误:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        description: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : error.message
    });
};

// 注册错误处理中间件
app.use(errorHandler as unknown as ErrorHandler);

// 获取服务器端口配置
const port = Number(process.env.PORT) || 3000;

/**
 * 启动服务器和数据库连接
 * 处理不同环境下的服务器启动逻辑
 */
const startServer = async (): Promise<void> => {
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
void startServer().catch(console.error);

// 导出应用实例（用于测试和其他模块引用）
export default app;