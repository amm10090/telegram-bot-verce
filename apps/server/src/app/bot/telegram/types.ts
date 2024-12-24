// apps/server/src/app/bot/telegram/types.ts

import { Request, Response, NextFunction as ExpressNextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
import { Document } from 'mongoose';
import { ParsedQs } from 'qs';

/**
 * HTTP状态码枚举
 * 定义所有可能用到的HTTP状态码，提供类型安全和代码可读性
 */
export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500
}

/**
 * API错误类型枚举
 * 定义系统中所有可能的错误类型
 */
export enum ApiErrorType {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    DUPLICATE_KEY = 'DUPLICATE_KEY',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TELEGRAM_API_ERROR = 'TELEGRAM_API_ERROR'
}

/**
 * Bot状态枚举
 * 定义Bot的所有可能状态
 */
export enum BotStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

/**
 * 请求体接口
 * 定义不同API端点的请求数据结构
 */
export interface RequestBody {
    name?: string;
    apiKey?: string;
    isEnabled?: boolean;
    token?: string;
    [key: string]: any;
}

/**
 * 请求参数接口
 * 定义URL参数的数据结构
 * 将所有可选参数默认为空字符串，以满足 Express Request 类型的要求
 */
export interface RequestParams {
    [key: string]: string;  // 索引签名只允许字符串值
}

/**
 * 查询参数的字符串映射类型
 * 将数字类型转换为字符串，确保类型兼容性
 */
type QueryParamValue = string | string[] | ParsedQs | ParsedQs[] | undefined;

/**
 * 查询参数接口
 * 定义所有可能的URL查询参数
 * 使用类型转换确保与ParsedQs兼容
 */
export interface QueryParams {
    status?: BotStatus;
    search?: string;
    page?: string;            // 存储为字符串，在使用时进行转换
    limit?: string;           // 存储为字符串，在使用时进行转换
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    [key: string]: QueryParamValue;
}

/**
 * API响应的元数据接口
 */
export interface ResponseMetadata {
    timestamp: string;
    requestId?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

/**
 * API响应接口
 * 定义所有API响应的标准格式
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
    description?: string;
    metadata?: ResponseMetadata;
}

/**
 * 扩展的请求接口
 * 为所有请求处理器提供统一的类型定义
 */
export interface ExtendedRequest extends Request {
    body: RequestBody;
    query: QueryParams;
    params: RequestParams;
    headers: IncomingHttpHeaders & {
        'x-api-key'?: string;
        'request-id'?: string;
    };
}

/**
 * 扩展的响应接口
 * 确保所有响应都支持链式调用和标准格式
 */
export interface ExtendedResponse<T = any> extends Response {
    json(body: ApiResponse<T>): this;
    status(code: HttpStatus): this;
}

/**
 * 中间件函数类型
 * 从express导出以确保类型一致性
 */
export type NextFunction = ExpressNextFunction;

/**
 * 请求处理器类型
 * 定义Express请求处理器的标准类型
 */
export type RequestHandler = (
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
) => Promise<void> | void;

/**
 * 错误处理器类型
 * 专门处理错误的中间件类型
 */
export type ErrorHandler = (
    error: Error,
    req: ExtendedRequest,
    res: ExtendedResponse,
    next: NextFunction
) => void;

/**
 * Telegram Bot的文档接口
 * 定义存储在MongoDB中的数据结构
 */
export interface TelegramBotDocument extends Document {
    name: string;
    apiKey: string;
    isEnabled: boolean;
    createdAt: Date;
    lastUsed: Date | null;
    status: BotStatus;
    formattedCreatedAt: string;
    formattedLastUsed: string;
    metadata?: {
        version: string;
        lastChecked: Date;
        webhookUrl?: string;
        commandCount?: number;
    };
}

/**
 * Telegram Bot信息接口
 */
export interface TelegramBotInfo {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups?: boolean;
    can_read_all_group_messages?: boolean;
    supports_inline_queries?: boolean;
    [key: string]: any;
}

/**
 * Telegram API响应接口
 */
export interface TelegramApiResponse {
    ok: boolean;
    result?: TelegramBotInfo;
    description?: string;
    error_code?: number;
}