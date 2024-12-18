// apps/server/src/app/bot/telegram/validate.ts
import { Request, Response } from 'express';
import fetch from 'node-fetch';  // 现在使用的是 2.x 版本，支持 CommonJS 导入

/**
 * Telegram API 响应的接口定义
 */
interface TelegramApiResponse {
    ok: boolean;
    result?: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username: string;
        can_join_groups: boolean;
        can_read_all_group_messages: boolean;
        supports_inline_queries: boolean;
    };
    description?: string;
}

/**
 * 调用 Telegram API 验证 Bot Token 的函数
 * 使用 node-fetch 发送 HTTP 请求
 */
async function validateTelegramToken(token: string): Promise<TelegramApiResponse> {
    try {
        // 使用 node-fetch 发送请求
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await response.json() as TelegramApiResponse;

        return {
            ok: data.ok,
            result: data.ok ? data.result : undefined,
            description: !data.ok ? data.description : undefined
        };
    } catch (error) {
        console.error('验证 Telegram token 时出错:', error);
        return {
            ok: false,
            description: '验证过程中发生错误，请稍后重试'
        };
    }
}

/**
 * Express 路由处理函数
 * 处理 API 请求并返回验证结果
 */
export async function validateHandler(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({
                ok: false,
                description: '缺少 token 参数'
            });
            return;
        }

        if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
            res.status(400).json({
                ok: false,
                description: 'token 格式不正确'
            });
            return;
        }

        const validationResult = await validateTelegramToken(token);

        if (validationResult.ok) {
            res.status(200).json(validationResult);
        } else {
            res.status(400).json(validationResult);
        }

    } catch (error) {
        console.error('处理验证请求时出错:', error);
        res.status(500).json({
            ok: false,
            description: '服务器内部错误'
        });
    }
}