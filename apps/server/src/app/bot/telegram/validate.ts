// apps/server/src/app/bot/telegram/validate.ts

// 导入必要的类型和模块
import { Request, Response } from 'express';
import fetch from 'node-fetch';

/**
 * Telegram Bot 信息接口
 * 定义 Bot API 返回的数据结构
 */
interface TelegramBotInfo {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
}

/**
 * Telegram API 响应接口
 * 定义 API 返回的标准格式
 */
interface TelegramApiResponse {
    ok: boolean;
    result?: TelegramBotInfo;
    description?: string;
    error_code?: number;
}

/**
 * 验证 Telegram Bot Token 的函数
 * 调用 Telegram API 验证 token 是否有效
 */
async function validateTelegramToken(token: string): Promise<TelegramApiResponse> {
    try {
        // 构建 API URL
        const apiUrl = `https://api.telegram.org/bot${token}/getMe`;

        // 发送请求到 Telegram API
        const response = await fetch(apiUrl);
        const data = await response.json() as TelegramApiResponse;

        // 记录验证结果
        console.log('Token 验证结果:', {
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
        // 记录错误详情
        console.error('验证 Token 时发生错误:', error);

        return {
            ok: false,
            description: '验证过程中发生错误，请稍后重试'
        };
    }
}

/**
 * Express 路由处理函数
 * 处理 token 验证请求
 */
export async function validateHandler(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.body;

        // 验证 token 是否存在
        if (!token) {
            res.status(400).json({
                ok: false,
                description: '缺少 token 参数'
            });
            return;
        }

        // 验证 token 格式
        if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
            res.status(400).json({
                ok: false,
                description: 'token 格式不正确'
            });
            return;
        }

        // 调用 Telegram API 验证 token
        const validationResult = await validateTelegramToken(token);

        // 根据验证结果返回响应
        if (validationResult.ok) {
            res.status(200).json(validationResult);
        } else {
            res.status(400).json(validationResult);
        }

    } catch (error) {
        // 记录错误并返回统一的错误响应
        console.error('处理验证请求时出错:', error);
        res.status(500).json({
            ok: false,
            description: '服务器内部错误'
        });
    }
}