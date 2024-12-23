// apps/server/src/index.ts

/**
 * 导入必要的依赖和类型
 * 我们使用 as 重命名基础类型以避免与扩展接口冲突
 */
import express, {
    Express,
    Request as ExpressRequest,
    Response as ExpressResponse,
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

/**
 * 扩展 Express 的 Request 和 Response 接口
 * 添加必要的类型定义以确保类型安全
 */
interface Request extends ExpressRequest {
    body: any;
    query: any;
    params: any;
}

interface Response extends ExpressResponse {
    json: (body: any) => this;
    status: (code: number) => this;
}


/**
 * 设置系统默认时区为中国时区
 * 确保所有时间操作都基于东八区
 */
moment.tz.setDefault('Asia/Shanghai');

/**
 * 数据库状态接口定义
 * 用于监控和报告数据库连接状态
 */
interface DbStatus {
    status: string;      // 连接状态的英文描述
    description: string; // 连接状态的中文描述
}

interface FullDbStatus extends DbStatus {
    host: string;            // 数据库主机地址
    name: string;            // 数据库名称
    lastConnectedTime: string; // 最后连接时间
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
 * 获取数据库连接状态信息
 * @returns 数据库状态信息对象
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
 * @returns 包含连接状态、主机名、数据库名和最后连接时间的状态信息
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
 * CORS 配置
 * 定义允许的来源、方法和请求头
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
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.log(`[${formatChineseTime()}] ${req.method} ${req.path}`);
    next();
};

app.use(requestLogger);

/**
 * 健康检查路由
 * 提供系统状态监控接口
 */
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

// 注册 Telegram bot 相关路由
app.use('/api/bot/telegram', telegramRoutes);

/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误
 */
const errorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
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