// apps/server/src/types/express.d.ts

import {
    Request,
    Response,
    NextFunction as ExpressNextFunction,
    RequestHandler as ExpressRequestHandler,
    ErrorRequestHandler as ExpressErrorRequestHandler
} from 'express';

/**
 * 核心类型定义模块
 * 
 * @description
 * 该模块集中定义了项目中所有的核心类型，包括：
 * - 请求/响应接口扩展
 * - API响应格式
 * - 错误处理机制
 * - 状态码定义
 * 
 * @module Types
 * @version 1.0.0
 */

/**
 * API响应接口定义
 * 
 * @description
 * 定义了统一的API响应格式，支持泛型数据类型
 * 
 * @template T - 响应数据的类型参数
 */
export interface ApiResponse<T = any> {
    /** 操作是否成功 */
    success: boolean;

    /** 响应消息 */
    message: string;

    /** 响应数据（可选） */
    data?: T;

    /** 详细信息（可选） */
    details?: {
        /** 时间戳（ISO格式） */
        timestamp: string;

        /** 请求路径（可选） */
        path?: string;

        /** 请求方法（可选） */
        method?: string;

        /** 错误类型（可选） */
        errorType?: string;

        /** 其他任意详细信息 */
        [key: string]: any;
    };
}

/**
 * 扩展的Express请求接口
 */
export interface ExtendedRequest extends Request {
    // 继承原始Request的属性
    headers: IncomingHttpHeaders;  // 添加headers属性
    method: string;               // 添加method属性
    path: string;                // 添加path属性
    originalUrl: string;         // 添加originalUrl属性
    url: string;                 // 添加url属性

    // 用户上下文（可选）
    user?: {
        id: string;
        role: string;
        permissions?: string[];
    };

    // 请求追踪（可选）
    requestId?: string;
    startTime?: number;
}

/**
 * 扩展的Express响应接口
 */
export interface ExtendedResponse extends Response {
    json: (body: any) => ExtendedResponse;
    status: (code: number) => ExtendedResponse;
    send: (body: any) => ExtendedResponse;
}

/**
 * HTTP状态码枚举
 */
export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503
}

/**
 * 标准请求处理器类型
 */
export type RequestHandler = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
) => Promise<void> | void;

/**
 * 错误处理器类型
 */
export type ErrorHandler = (
    error: Error,
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
) => void | Promise<void>;

/**
 * Express NextFunction类型
 */
export type NextFunction = ExpressNextFunction;

/**
 * API错误基类
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        public readonly code?: string
    ) {
        super(message);
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

/**
 * 中间件构建器接口
 */
export type Middleware = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
) => void;


/**
 * 验证错误类
 */
export class ValidationError extends ApiError {
    constructor(message: string) {
        super(message, HttpStatus.BAD_REQUEST);
        this.name = 'ValidationError';
    }
}

// 重新导出Express的基础类型
export {
    Request,
    Response,
    ExpressRequestHandler,
    ExpressErrorRequestHandler
};