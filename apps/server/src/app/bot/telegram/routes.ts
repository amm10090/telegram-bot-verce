// apps/server/src/app/bot/telegram/routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { validateHandler } from './validate';
import { saveApiKeyHandler, getAllBotsHandler, updateBotHandler, deleteBotHandler } from './save-key';

/**
 * 创建路由实例
 * Express.Router() 用于创建模块化的路由处理器
 */
const router = Router();

/**
 * 自定义错误接口
 * 扩展标准 Error 接口，添加可选的状态码属性
 */
interface CustomError extends Error {
    status?: number;
    code?: string;
}

/**
 * 请求体验证中间件
 * 确保所有请求都具有正确的 JSON 结构
 */
const validateRequestBody = (req: Request, res: Response, next: NextFunction): void => {
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
 */
const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
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
 */
const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
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

// 配置路由中间件和端点
try {
    // 应用请求体验证中间件
    router.use(validateRequestBody);

    // Bot 相关路由
    router.post('/validate', (req: Request, res: Response, next: NextFunction) => {
        validateHandler(req, res).catch(next);
    });

    router.post('/bots', (req: Request, res: Response, next: NextFunction) => {
        saveApiKeyHandler(req, res).catch(next);
    });

    router.get('/bots', (req: Request, res: Response, next: NextFunction) => {
        getAllBotsHandler(req, res).catch(next);
    });

    router.put('/bots/:id', (req: Request, res: Response, next: NextFunction) => {
        updateBotHandler(req, res).catch(next);
    });

    router.delete('/bots/:id', (req: Request, res: Response, next: NextFunction) => {
        deleteBotHandler(req, res).catch(next);
    });

    // 处理 404 错误
    router.use((req: Request, res: Response) => {
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