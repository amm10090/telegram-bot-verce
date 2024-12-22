// apps/server/src/app/bot/telegram/validate.ts

import { Request, Response } from 'express';
import fetch from 'node-fetch';

// 我们保留并增强原有的接口定义
interface TelegramBotInfo {
    id: number;                           // Bot的唯一标识符
    is_bot: boolean;                      // 是否是Bot标识
    first_name: string;                   // Bot的显示名称
    username: string;                     // Bot的用户名
    can_join_groups: boolean;             // 是否可以加入群组
    can_read_all_group_messages: boolean; // 是否可以读取所有群组消息
    supports_inline_queries: boolean;      // 是否支持内联查询
}

// 增加更多的类型定义，提高代码的可维护性
interface TelegramApiResponse {
    ok: boolean;
    result?: TelegramBotInfo;
    description?: string;
    error_code?: number;
}

/**
 * 验证Bot信息的结构是否完整
 * 这个函数帮助我们确保从Telegram API返回的数据符合预期格式
 */
function isValidBotInfo(data: unknown): data is TelegramBotInfo {
    const botInfo = data as TelegramBotInfo;
    return (
        typeof botInfo === 'object' &&
        botInfo !== null &&
        typeof botInfo.id === 'number' &&
        typeof botInfo.is_bot === 'boolean' &&
        typeof botInfo.first_name === 'string' &&
        typeof botInfo.username === 'string'
    );
}

/**
 * 验证API响应的数据结构
 * 确保返回的数据遵循预期的格式
 */
function isValidBotResponse(data: unknown): data is TelegramApiResponse {
    const response = data as TelegramApiResponse;
    return (
        typeof response === 'object' &&
        response !== null &&
        typeof response.ok === 'boolean' &&
        (!response.result || isValidBotInfo(response.result))
    );
}

/**
 * 核心验证函数
 * 负责与Telegram API通信并验证Token的有效性
 */
async function validateTelegramToken(token: string): Promise<TelegramApiResponse> {
    try {
        // 构建Telegram API的URL
        const apiUrl = `https://api.telegram.org/bot${token}/getMe`;

        // 发送请求到Telegram API
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
            throw new Error('Telegram API返回了无效的数据结构');
        }

        // 记录验证结果，便于调试
        console.log('Telegram API验证结果:', {
            ok: data.ok,
            botId: data.result?.id,
            username: data.result?.username
        });

        // 返回标准格式的响应
        return {
            ok: data.ok,
            result: data.ok ? data.result : undefined,
            description: !data.ok ? data.description : undefined,
            error_code: !data.ok ? data.error_code : undefined
        };
    } catch (error) {
        // 错误处理和日志记录
        console.error('验证Token时发生错误:', error);
        return {
            ok: false,
            description: error instanceof Error ? error.message : '验证过程中发生错误，请稍后重试'
        };
    }
}

/**
 * Express路由处理函数
 * 处理来自客户端的验证请求
 */
export async function validateHandler(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.body;

        // 验证token是否存在
        if (!token) {
            res.status(400).json({
                success: false,
                message: '缺少token参数'
            });
            return;
        }

        // 验证token格式是否正确
        if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
            res.status(400).json({
                success: false,
                message: 'token格式不正确'
            });
            return;
        }

        // 调用验证函数
        const validationResult = await validateTelegramToken(token);

        // 处理验证结果
        if (validationResult.ok && validationResult.result) {
            // 成功响应
            res.status(200).json({
                success: true,
                data: {
                    botInfo: validationResult.result,
                    token: token
                },
                message: 'Token验证成功'
            });
        } else {
            // 失败响应
            res.status(400).json({
                success: false,
                message: validationResult.description || 'Token验证失败'
            });
        }

    } catch (error) {
        // 统一的错误处理
        console.error('处理验证请求时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
}