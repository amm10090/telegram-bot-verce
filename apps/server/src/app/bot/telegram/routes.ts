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
 * 扩展标准 Error 接口，添加可选的状态码
 */
interface CustomError extends Error {
    status?: number;
}

/**
 * 统一的错误处理中间件
 * 捕获路由处理过程中的错误，并返回统一格式的错误响应
 */
const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // 记录错误信息
    console.error('路由错误:', err);
    // 使用错误对象中的状态码，如果没有则默认使用 500
    const status = err.status || 500;
    // 返回统一格式的错误响应
    res.status(status).json({
        ok: false,
        description: '服务器内部错误'
    });
};

/**
 * 验证请求体格式的中间件
 * 确保请求体存在且格式正确
 */
const validateRequestBody = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // 检查请求体是否存在且是对象类型
    if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({
            ok: false,
            description: '无效的请求体格式'
        });
        return;
    }
    // 验证通过，继续处理请求
    next();
};

// 设置路由和中间件
try {
    // 注册验证端点
    router.post('/validate', validateHandler);

    // 注册错误处理中间件
    router.use(errorHandler);
} catch (error) {
    // 记录路由配置过程中的错误
    console.error('路由配置错误:', error);
}

// 导出路由实例
export default router;