// apps/server/src/app/bot/telegram/routes.ts

// 导入必要的 Express 相关类型和模块
import { Router, Request, Response, NextFunction } from 'express';
import { validateHandler } from './validate';

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
 * 错误处理中间件
 * 统一处理路由中的错误
 */
const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // 记录错误详情
    console.error('路由错误:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        status: err.status
    });

    // 确定响应状态码
    const statusCode = err.status || 500;

    // 返回统一格式的错误响应
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

    // 注册验证端点
    router.post('/validate', validateHandler);

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
    // 记录路由配置过程中的错误
    console.error('路由配置错误:', error);
    throw error; // 重新抛出错误，确保应用能够感知到初始化失败
}

// 导出路由实例
export default router;