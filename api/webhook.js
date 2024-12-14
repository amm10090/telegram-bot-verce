// api/webhook.js
import { botCore } from './bot.js';
import { dbManager } from './database.js';
import { logger } from '../services/logger.js';
import { messageHandler } from '../handlers/messages.js';
import { errorHandler } from '../handlers/errors.js';

export default async function handler(request, response) {
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        if (request.method === 'POST') {
            const update = request.body;

            // 初始化核心服务
            await dbManager.connect();
            await botCore.initialize();

            // 处理消息
            await messageHandler.handleUpdate(update, botCore);

            return response.status(200).json({ ok: true });
        }

        return response.status(405).json({ error: '不支持的请求方法' });
    } catch (error) {
        await errorHandler.handle(error);
        logger.error('Webhook处理错误', error);

        return response.status(500).json({
            ok: false,
            error: process.env.NODE_ENV === 'production' ?
                '服务器内部错误' : error.message
        });
    }
}