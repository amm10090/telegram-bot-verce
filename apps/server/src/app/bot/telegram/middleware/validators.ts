// apps/server/src/app/bot/telegram/middleware/validators.ts

import mongoose from 'mongoose';
import { ExtendedRequest, ExtendedResponse, HttpStatus } from '../types';
import { ApiResponse } from '../../../.././types/';
import { NextFunction } from 'express';

/**
 * 请求验证器类 (RequestValidator)
 * 
 * @description
 * 提供了一组用于验证HTTP请求的静态方法，实现请求的预处理和数据验证。
 * 每个验证方法都遵循统一的响应格式，确保API的一致性。
 */
export class RequestValidator {
    /**
     * 创建标准格式的错误响应
     * 
     * @param success - 请求是否成功
     * @param message - 错误消息
     * @param details - 错误详情
     * @returns 格式化的API响应
     */
    private static createResponse<T>(
        success: boolean,
        message: string,
        details?: Record<string, any>
    ): ApiResponse<T> {
        return {
            success,
            message,
            details: details ? {
                ...details,
                timestamp: new Date().toISOString()
            } : undefined
        };
    }

    /**
     * 验证请求体格式
     * 
     * @description
     * 确保请求体存在且为有效的JSON对象
     */
    static validateBody(
        req: ExtendedRequest,
        res: ExtendedResponse,
        next: NextFunction
    ): void {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            const response = this.createResponse(
                false,
                '无效的请求体格式',
                {
                    received: typeof req.body,
                    expected: 'object'
                }
            );
            res.status(HttpStatus.BAD_REQUEST).json(response);
            return;
        }
        next();
    }

    /**
     * 验证API密钥
     * 
     * @description
     * 验证请求头中是否包含有效的API密钥
     */
    static validateApiKey(
        req: ExtendedRequest,
        res: ExtendedResponse,
        next: NextFunction
    ): void {
        const apiKey = req.headers['x-api-key'];
        const API_KEY_PATTERN = /^[A-Za-z0-9-_]{32,}$/;

        if (!apiKey || typeof apiKey !== 'string') {
            const response = this.createResponse(
                false,
                '缺少API密钥或格式无效',
                {
                    required: 'x-api-key header',
                    provided: apiKey ? typeof apiKey : 'missing'
                }
            );
            res.status(HttpStatus.UNAUTHORIZED).json(response);
            return;
        }

        if (!API_KEY_PATTERN.test(apiKey)) {
            const response = this.createResponse(
                false,
                'API密钥格式无效',
                {
                    hint: '请确保使用正确格式的API密钥'
                }
            );
            res.status(HttpStatus.UNAUTHORIZED).json(response);
            return;
        }

        next();
    }

    /**
     * 验证MongoDB ObjectId格式
     * 
     * @description
     * 确保URL参数中的ID符合MongoDB的ObjectId格式要求
     */
    static validateObjectId(
        req: ExtendedRequest,
        res: ExtendedResponse,
        next: NextFunction
    ): void {
        const { id } = req.params;

        if (!id || !mongoose.isValidObjectId(id)) {
            const response = this.createResponse(
                false,
                '无效的ID格式',
                {
                    received: id,
                    expected: 'MongoDB ObjectId format',
                    example: new mongoose.Types.ObjectId().toString()
                }
            );
            res.status(HttpStatus.BAD_REQUEST).json(response);
            return;
        }

        next();
    }

    /**
     * 验证分页参数
     * 
     * @description
     * 验证和规范化请求中的分页参数
     */
    static validatePagination(
        req: ExtendedRequest,
        res: ExtendedResponse,
        next: NextFunction
    ): void {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit as string) || 10)
        );

        // 将验证后的值添加到请求对象
        req.query.page = page.toString();
        req.query.limit = limit.toString();

        // 验证转换后的值是否有效
        if (isNaN(page) || isNaN(limit)) {
            const response = this.createResponse(
                false,
                '无效的分页参数',
                {
                    received: {
                        page: req.query.page,
                        limit: req.query.limit
                    },
                    allowedRange: {
                        page: '≥ 1',
                        limit: '1-100'
                    }
                }
            );
            res.status(HttpStatus.BAD_REQUEST).json(response);
            return;
        }

        next();
    }
}

/**
 * 自定义验证错误类
 * 用于在验证过程中抛出带有状态码的错误
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = HttpStatus.BAD_REQUEST
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}