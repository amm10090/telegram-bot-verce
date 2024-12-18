// apps/web/pages/api/bot/telegram/validate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { TelegramBotService } from '../../../../../server/src/app/config/telegram-bot-service';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({
            ok: false,
            description: '只允许 POST 请求'
        });
    }

    try {
        const { token } = req.body;

        // 验证 token 是否存在
        if (!token) {
            return res.status(400).json({
                ok: false,
                description: '缺少 token 参数'
            });
        }

        // 创建 Telegram Bot 服务实例
        const botService = new TelegramBotService(token);

        // 验证 token
        const validationResult = await botService.validateApiKey();

        if (validationResult) {
            const botInfo = await botService.getMe();
            res.status(200).json({
                ok: true,
                result: botInfo.result
            });
        } else {
            res.status(400).json({
                ok: false,
                description: '无效的 API 密钥'
            });
        }
    } catch (error) {
        console.error('API 验证错误:', error);
        res.status(500).json({
            ok: false,
            description: '服务器内部错误'
        });
    }
}