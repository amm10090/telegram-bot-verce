// apps/server/src/app/bot/telegram/routes.ts

/**
 * Telegram Bot 路由模块
 * 
 * @module TelegramRoutes
 * @description
 * 本模块实现了Telegram Bot API的路由层，采用面向对象的方式组织代码，
 * 确保了路由配置的可维护性和可扩展性。
 * 
 * 技术架构概述：
 * - 使用类封装路由逻辑，提供清晰的代码组织结构
 * - 实现中间件链模式，支持请求的预处理和后处理
 * - 统一的错误处理机制，确保异常情况的优雅处理
 * 
 * @version 1.0.0
 */

import {
    Router,
    Request,
    Response,
    NextFunction,
} from 'express';

import { validateHandler } from './validate';
import {
    saveApiKeyHandler,
    getAllBotsHandler,
    updateBotHandler,
    deleteBotHandler
} from './save-key';
import { RequestValidator } from './middleware/validators';
import {
    ExtendedRequest,
    ExtendedResponse,
    HttpStatus,
    Middleware,
    RequestHandler,
    ErrorHandler,
    ApiResponse
} from '../../../types/express';

/**
 * Telegram Bot路由配置类
 * 
 * @class RouteConfig
 * @description
 * 提供了一个结构化的方式来组织和管理Telegram Bot相关的路由配置。
 * 采用面向对象设计模式，实现了关注点分离和代码复用。
 */
class RouteConfig {
    private router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * 请求处理器包装函数
     * 
     * @private
     * @description
     * 为请求处理器添加错误处理和类型安全的包装。
     * 统一处理异步操作中的异常，确保错误能够被全局错误处理器捕获。
     */
    private wrapHandler(handler: RequestHandler): Middleware {
        return async (
            req: ExtendedRequest,
            res: ExtendedResponse,
            next: NextFunction
        ): Promise<void> => {
            try {
                await Promise.resolve(handler(req, res, next));
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * 初始化路由配置
     * 
     * @private
     * @description
     * 配置所有的路由端点，包括：
     * - API密钥验证
     * - Bot管理操作（CRUD）
     * - 错误处理
     */
    private initializeRoutes(): void {
        // 全局中间件
        this.setupGlobalMiddleware();

        // API端点
        this.setupApiEndpoints();

        // 错误处理
        this.setupErrorHandling();
    }

    /**
     * 配置全局中间件
     * 
     * @private
     * @description
     * 设置适用于所有路由的中间件，包括：
     * - 请求体验证
     * - API密钥验证
     * - 请求日志记录
     */
    private setupGlobalMiddleware(): void {
        // 使用类型断言确保类型安全
        this.router.use(this.wrapHandler(RequestValidator.validateBody) as unknown as Middleware);

        this.router.use(
            /^(?!\/validate).*/,
            this.wrapHandler(RequestValidator.validateApiKey) as unknown as Middleware
        );
    }

    /**
     * 配置API端点
     * 
     * @private
     * @description
     * 设置所有的API端点，包括：
     * - Bot验证
     * - Bot创建、读取、更新、删除操作
     */
    private setupApiEndpoints(): void {
        // Bot验证端点
        this.router.post(
            '/validate',
            this.wrapHandler(validateHandler) as unknown as Middleware
        );

        // Bot管理端点
        this.router.post(
            '/bots',
            this.wrapHandler(saveApiKeyHandler) as unknown as Middleware
        );

        this.router.get(
            '/bots',
            this.wrapHandler(getAllBotsHandler)
        );

        this.router.put(
            '/bots/:id',
            [
                this.wrapHandler(RequestValidator.validateObjectId),
                this.wrapHandler(updateBotHandler)
            ]
        );

        this.router.delete(
            '/bots/:id',
            [
                this.wrapHandler(RequestValidator.validateObjectId),
                this.wrapHandler(deleteBotHandler)
            ]
        );
    }

    /**
     * 配置错误处理
     * 
     * @private
     * @description
     * 设置错误处理中间件，包括：
     * - 404错误处理
     * - 全局错误处理
     */
    private setupErrorHandling(): void {
        // 404错误处理
        this.router.use('*', this.handle404Error());

        // 全局错误处理
        this.router.use(this.handleError());
    }

    /**
     * 404错误处理器
     * 
     * @private
     * @returns 处理404错误的中间件
     * 
     * @description
     * 统一处理所有未匹配路由的请求，返回标准的404响应。
     * 通过提供详细的错误信息，帮助开发者和用户更好地理解和定位问题。
     */
    private handle404Error(): RequestHandler {
        return (req: ExtendedRequest, res: ExtendedResponse): void => {
            const timestamp = new Date().toISOString();
            const path = req.originalUrl;
            const method = req.method;

            // 创建标准格式的错误响应
            const response: ApiResponse = {
                success: false,
                message: '未找到请求的资源',
                data: {
                    path,
                    method,
                    timestamp,
                    errorType: 'NotFoundError'
                }
            };

            res.status(HttpStatus.NOT_FOUND).json(response);
        };
    }

    /**
     * 全局错误处理器
     * 
     * @private
     * @returns 全局错误处理中间件
     * 
     * @description
     * 错误处理是我们系统的关键部分，它不仅需要处理异常，
     * 还需要提供有意义的错误信息以帮助开发者和用户理解问题。
     * 
     * 实现策略：
     * 1. 错误日志记录 - 确保所有错误都被适当记录
     * 2. 环境感知 - 在开发环境提供详细信息，生产环境保持简洁
     * 3. 标准化响应 - 保持一致的错误响应格式
     */
    private handleError(): ErrorHandler {
        return (
            error: Error,
            req: ExtendedRequest,
            res: ExtendedResponse,
            next: NextFunction
        ): void => {
            // 错误日志记录，包含完整的上下文信息
            console.error('路由错误:', {
                message: error.message,
                stack: error.stack,
                path: req.originalUrl,
                method: req.method
            });

            // 准备错误响应内容
            const errorDetails = {
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                method: req.method,
                errorType: error.name || 'InternalServerError'
            };

            // 创建符合 ApiResponse 接口的响应
            const response: ApiResponse = {
                success: false,
                message: process.env.NODE_ENV === 'production'
                    ? '服务器内部错误'
                    : error.message,
                data: errorDetails
            };

            const statusCode = (error as any).status || HttpStatus.INTERNAL_SERVER_ERROR;
            res.status(statusCode).json(response);
        };
    }

    /**
     * 获取路由实例
     * 
     * @public
     * @returns Express路由实例
     */
    public getRouter(): Router {
        return this.router;
    }
}

// 创建并导出路由实例
const routeConfig = new RouteConfig();
export default routeConfig.getRouter();