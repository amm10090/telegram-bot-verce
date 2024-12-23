// apps/server/src/app/bot/telegram/routes.ts

import {
    Router,
    Request,
    Response,
    NextFunction,
    RequestHandler,
    ErrorRequestHandler
} from 'express';
import { IncomingHttpHeaders } from 'http';
import { validateHandler } from './validate';
import {
    saveApiKeyHandler,
    getAllBotsHandler,
    updateBotHandler,
    deleteBotHandler
} from './save-key';

/**
 * 扩展基础请求接口
 * 这个接口扩展了 Express 的 Request 接口，添加了我们需要的额外属性
 */
interface ExtendedRequest extends Request {
    body: any;
    query: Record<string, any>;
    params: Record<string, any>;
    headers: IncomingHttpHeaders & {
        'x-api-key'?: string;
    };
}

/**
 * 扩展响应接口
 * 使用泛型参数来支持不同的响应体类型
 */
interface ExtendedResponse extends Response {
    json(body: any): this;
    status(code: number): this;
}

/**
 * 创建路由实例
 * Express.Router() 用于创建模块化的路由处理器
 */
const router: Router = Router();

/**
 * 请求体验证中间件
 * 确保所有请求都具有正确的 JSON 结构
 */
const validateRequestBody: RequestHandler = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): void => {
    if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({
            ok: false,
            description: '无效的请求体格式'
        });
        return;
    }
    next();
};

/**
 * API 密钥验证中间件
 * 验证请求中是否包含有效的 API 密钥
 */
const validateApiKey: RequestHandler = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): void => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        res.status(401).json({
            ok: false,
            description: '缺少 API 密钥'
        });
        return;
    }
    next();
};

/**
 * 错误处理中间件
 * 统一处理路由中的错误
 */
const errorHandler: ErrorRequestHandler = (
    err: any,
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
): void => {
    console.error('路由错误:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        status: err.status
    });

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        ok: false,
        description: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
};

/**
 * 异步处理器包装函数
 * 用于统一处理异步路由的错误
 */
const asyncHandler = (
    fn: (req: ExtendedRequest, res: ExtendedResponse, next: NextFunction) => Promise<void>
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req as ExtendedRequest, res as ExtendedResponse, next)).catch(next);
    };
};

// 配置路由中间件和端点
try {
    // 应用请求体验证中间件
    router.use(validateRequestBody);

    // Bot 相关路由
    router.post('/validate', asyncHandler(async (req: ExtendedRequest, res: ExtendedResponse) => {
        await validateHandler(req, res);
    }));

    router.post('/bots', asyncHandler(async (req: ExtendedRequest, res: ExtendedResponse) => {
        await saveApiKeyHandler(req, res);
    }));

    router.get('/bots', asyncHandler(async (req: ExtendedRequest, res: ExtendedResponse) => {
        await getAllBotsHandler(req, res);
    }));

    router.put('/bots/:id', asyncHandler(async (req: ExtendedRequest, res: ExtendedResponse) => {
        await updateBotHandler(req, res);
    }));

    router.delete('/bots/:id', asyncHandler(async (req: ExtendedRequest, res: ExtendedResponse) => {
        await deleteBotHandler(req, res);
    }));

    // 处理 404 错误
    router.use((req: ExtendedRequest, res: ExtendedResponse) => {
        res.status(404).json({
            ok: false,
            description: '未找到请求的资源'
        });
    });

    // 注册错误处理中间件
    router.use(errorHandler);
} catch (error) {
    console.error('路由配置错误:', error);
    throw error;
}

export default router;