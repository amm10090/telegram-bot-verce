// apps/server/src/index.ts

// 导入必要的依赖和类型
import express, {
    Express,
    Request,
    Response,
    NextFunction,
    RequestHandler,
    ErrorRequestHandler
} from 'express';
import cors, { CorsOptions } from 'cors';
import telegramRoutes from './app/bot/telegram/routes';
import connectDatabase from './app/config/database';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { healthCheckService } from './health-check.service';

// 设置系统默认时区为中国时区
moment.tz.setDefault('Asia/Shanghai');

/**
 * 扩展请求接口，添加我们需要的类型定义
 */
interface ExtendedRequest extends Request {
    body: any;
    query: Record<string, any>;
    params: Record<string, any>;
}

/**
 * 扩展响应接口，确保支持链式调用
 */
interface ExtendedResponse extends Response {
    json(body: any): this;
    status(code: number): this;
}

/**
 * 数据库状态接口
 * 用于监控和报告数据库连接状态
 */
interface DbStatus {
    status: string;      // 连接状态的英文描述
    description: string; // 连接状态的中文描述
}

/**
 * 完整数据库状态接口
 * 扩展基本状态，包含更多详细信息
 */
interface FullDbStatus extends DbStatus {
    host: string;            // 数据库主机地址
    name: string;            // 数据库名称
    lastConnectedTime: string; // 最后连接时间
}

/**
 * 格式化时间为中国时区
 * @param date 需要格式化的日期，默认为当前时间
 * @returns 格式化后的时间字符串
 */
const formatChineseTime = (date: Date = new Date()): string => {
    return moment(date)
        .tz('Asia/Shanghai')
        .format('YYYY-MM-DD HH:mm:ss [GMT+8]');
};

/**
 * 格式化运行时间
 * @param seconds 运行的秒数
 * @returns 格式化后的运行时间字符串
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
 * 获取数据库连接状态
 * @returns 数据库状态信息
 */
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

/**
 * 获取完整的数据库状态信息
 * @returns 完整的数据库状态信息
 */
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

// 加载环境变量配置
dotenv.config();

// 创建 Express 应用实例
const app: Express = express();

/**
 * 配置 CORS 选项
 * 定义允许的源、方法和头部
 */
const corsOptions: CorsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

// 配置全局中间件
app.use(cors(corsOptions));
app.use(express.json());

/**
 * 请求日志中间件
 * 记录所有请求的时间和路径
 */
const requestLogger: RequestHandler = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): void => {
    const method = req.method || 'UNKNOWN';
    const path = (req as any).path || 'UNKNOWN';
    console.log(`[${formatChineseTime()}] ${method} ${path}`);
    next();
};

app.use(requestLogger);

/**
 * 健康检查路由处理器
 * 提供系统状态监控接口
 */
const healthCheckHandler: RequestHandler = async (
    req: ExtendedRequest,
    res: ExtendedResponse
): Promise<void> => {
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
};

// 注册健康检查路由
app.get('/health', healthCheckHandler);

// 注册 Telegram bot 相关路由
app.use('/api/bot/telegram', telegramRoutes);

/**
 * 全局错误处理中间件
 * 统一处理未捕获的错误
 */
const errorHandler: ErrorRequestHandler = (
    err: Error,
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): void => {
    console.error('全局错误:', err);
    res.status(500).json({
        ok: false,
        description: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
};

// 注册错误处理中间件
app.use(errorHandler);

// 获取服务器端口配置
const port: number = Number(process.env.PORT) || 3000;

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
startServer();

// 导出应用实例（用于测试和其他模块引用）
export default app;