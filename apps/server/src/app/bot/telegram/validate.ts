// apps/server/src/app/bot/telegram/validate.ts

import fetch from 'node-fetch';
import {
    ExtendedRequest,
    ExtendedResponse,
    TelegramApiResponse
} from './types';

/**
 * 验证Bot信息的结构完整性
 */
function isValidBotInfo(data: unknown): boolean {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const botInfo = data as Record<string, unknown>;
    const requiredFields = [
        { field: 'id', type: 'number' },
        { field: 'is_bot', type: 'boolean' },
        { field: 'first_name', type: 'string' },
        { field: 'username', type: 'string' }
    ];

    return requiredFields.every(({ field, type }) =>
        field in botInfo && typeof botInfo[field] === type
    );
}

/**
 * 验证API响应的数据结构
 */
function isValidBotResponse(data: unknown): data is TelegramApiResponse {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const response = data as TelegramApiResponse;

    if (typeof response.ok !== 'boolean') {
        return false;
    }

    if (response.ok && response.result) {
        return isValidBotInfo(response.result);
    }

    if (!response.ok) {
        return typeof response.description === 'string' ||
            typeof response.error_code === 'number';
    }

    return true;
}

/**
 * 验证Telegram Bot Token
 */
async function validateTelegramToken(token: string): Promise<TelegramApiResponse> {
    try {
        const apiUrl = `https://api.telegram.org/bot${token}/getMe`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!isValidBotResponse(data)) {
            throw new Error('Telegram API返回了无效的数据结构');
        }

        console.log('Telegram API验证结果:', {
            ok: data.ok,
            botId: data.result?.id,
            username: data.result?.username
        });

        return {
            ok: data.ok,
            result: data.result,
            description: data.description,
            error_code: data.error_code
        };
    } catch (error) {
        console.error('验证Token时发生错误:', error);
        return {
            ok: false,
            description: error instanceof Error ? error.message : '验证过程中发生错误'
        };
    }
}

/**
 * Express路由处理函数
 */
export async function validateHandler(req: ExtendedRequest, res: ExtendedResponse): Promise<void> {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({
                success: false,
                message: '缺少token参数'
            });
            return;
        }

        const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
        if (!tokenPattern.test(token)) {
            res.status(400).json({
                success: false,
                message: 'token格式不正确'
            });
            return;
        }

        const validationResult = await validateTelegramToken(token);

        if (validationResult.ok && validationResult.result) {
            res.status(200).json({
                success: true,
                data: {
                    botInfo: validationResult.result,
                    token: token
                },
                message: 'Token验证成功'
            });
        } else {
            res.status(400).json({
                success: false,
                message: validationResult.description || 'Token验证失败'
            });
        }
    } catch (error) {
        console.error('处理验证请求时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
}