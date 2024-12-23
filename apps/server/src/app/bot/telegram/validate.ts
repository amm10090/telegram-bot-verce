// apps/server/src/app/bot/telegram/validate.ts

import {
    Request,
    Response,
    NextFunction
} from 'express';
import { IncomingHttpHeaders } from 'http';
import fetch from 'node-fetch';

/**
 * 扩展的请求接口
 * 包含了验证处理器所需的所有属性
 */
interface ExtendedRequest extends Request {
    body: {
        token?: string;
        [key: string]: any;
    };
    headers: IncomingHttpHeaders & {
        'x-api-key'?: string;
    };
}

/**
 * 扩展的响应接口
 * 确保响应方法支持链式调用
 */
interface ExtendedResponse extends Response {
    json(body: any): this;
    status(code: number): this;
}

/**
 * Telegram Bot 信息接口
 * 定义了从 Telegram API 返回的 Bot 信息结构
 */
interface TelegramBotInfo {
    id: number;                           // Bot的唯一标识符
    is_bot: boolean;                      // 是否是Bot标识
    first_name: string;                   // Bot的显示名称
    username: string;                     // Bot的用户名
    can_join_groups?: boolean;            // 是否可以加入群组
    can_read_all_group_messages?: boolean; // 是否可以读取所有群组消息
    supports_inline_queries?: boolean;     // 是否支持内联查询
}

/**
 * Telegram API 响应接口
 * 定义了 Telegram API 返回的标准响应格式
 */
interface TelegramApiResponse {
    ok: boolean;
    result?: TelegramBotInfo;
    description?: string;
    error_code?: number;
}

/**
 * 验证响应接口
 * 定义了我们的 API 返回的标准响应格式
 */
interface ValidationResponse {
    success: boolean;
    data?: {
        botInfo: TelegramBotInfo;
        token: string;
    };
    message?: string;
}

/**
 * 验证 Bot 信息的结构完整性
 * 使用类型守卫确保返回的数据符合预期格式
 * @param data - 需要验证的数据
 * @returns 类型守卫结果
 */
function isValidBotInfo(data: unknown): data is TelegramBotInfo {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const botInfo = data as TelegramBotInfo;

    // 验证必需字段
    const requiredFields = [
        { field: 'id', type: 'number' },
        { field: 'is_bot', type: 'boolean' },
        { field: 'first_name', type: 'string' },
        { field: 'username', type: 'string' }
    ];

    for (const { field, type } of requiredFields) {
        if (!(field in botInfo) || typeof botInfo[field as keyof TelegramBotInfo] !== type) {
            return false;
        }
    }

    return true;
}

/**
 * 验证 API 响应的数据结构
 * 确保从 Telegram 获取的响应符合预期格式
 * @param data - 需要验证的响应数据
 * @returns 类型守卫结果
 */
function isValidBotResponse(data: unknown): data is TelegramApiResponse {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const response = data as TelegramApiResponse;

    // 验证基本结构
    if (typeof response.ok !== 'boolean') {
        return false;
    }

    // 如果响应成功，验证结果数据
    if (response.ok && response.result) {
        return isValidBotInfo(response.result);
    }

    // 如果响应失败，验证错误信息
    if (!response.ok) {
        return typeof response.description === 'string' || typeof response.error_code === 'number';
    }

    return true;
}

/**
 * 验证 Telegram Bot Token
 * 与 Telegram API 通信并验证令牌的有效性
 * @param token - 要验证的 Telegram Bot Token
 * @returns Promise<TelegramApiResponse> 验证结果
 */
async function validateTelegramToken(token: string): Promise<TelegramApiResponse> {
    try {
        // 构建 Telegram API 的 URL
        const apiUrl = `https://api.telegram.org/bot${token}/getMe`;

        // 发送请求到 Telegram API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 解析响应数据
        const data = await response.json();

        // 验证响应数据的结构
        if (!isValidBotResponse(data)) {
            throw new Error('Telegram API 返回了无效的数据结构');
        }

        // 记录验证结果，便于调试
        console.log('Telegram API 验证结果:', {
            ok: data.ok,
            botId: data.result?.id,
            username: data.result?.username
        });

        return {
            ok: data.ok,
            result: data.ok ? data.result : undefined,
            description: !data.ok ? data.description : undefined,
            error_code: !data.ok ? data.error_code : undefined
        };
    } catch (error) {
        console.error('验证 Token 时发生错误:', error);
        return {
            ok: false,
            description: error instanceof Error ? error.message : '验证过程中发生错误，请稍后重试'
        };
    }
}

/**
 * Express 路由处理函数
 * 处理来自客户端的验证请求
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 */
export async function validateHandler(
    req: ExtendedRequest,
    res: ExtendedResponse
): Promise<void> {
    try {
        const { token } = req.body;

        // 验证 token 是否存在
        if (!token) {
            res.status(400).json({
                success: false,
                message: '缺少 token 参数'
            });
            return;
        }

        // 验证 token 格式是否正确
        const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
        if (!tokenPattern.test(token)) {
            res.status(400).json({
                success: false,
                message: 'token 格式不正确'
            });
            return;
        }

        // 调用验证函数
        const validationResult = await validateTelegramToken(token);

        // 处理验证结果
        if (validationResult.ok && validationResult.result) {
            const response: ValidationResponse = {
                success: true,
                data: {
                    botInfo: validationResult.result,
                    token: token
                },
                message: 'Token 验证成功'
            };
            res.status(200).json(response);
        } else {
            const response: ValidationResponse = {
                success: false,
                message: validationResult.description || 'Token 验证失败'
            };
            res.status(400).json(response);
        }
    } catch (error) {
        // 统一的错误处理
        console.error('处理验证请求时出错:', error);
        const response: ValidationResponse = {
            success: false,
            message: '服务器内部错误'
        };
        res.status(500).json(response);
    }
}

// 导出类型定义，以供其他模块使用
export type {
    TelegramBotInfo,
    TelegramApiResponse,
    ValidationResponse,
    ExtendedRequest,
    ExtendedResponse
};