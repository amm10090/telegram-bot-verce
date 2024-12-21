// apps/server/src/app/config/telegram-bot-service.ts

import fetch from 'node-fetch';

/**
 * Telegram API 响应的通用接口
 * 使用泛型 T 让我们可以处理不同类型的响应数据
 */
interface TelegramApiResponse<T> {
    ok: boolean;                // API 调用是否成功
    result?: T;                 // 成功时的返回数据
    description?: string;       // 错误时的描述信息
    error_code?: number;        // 错误代码
}

/**
 * Bot 信息接口
 * 定义了从 Telegram API 返回的 Bot 基本信息结构
 */
interface BotInfo {
    id: number;                           // Bot 的唯一标识符
    is_bot: boolean;                      // 用于确认这确实是个 Bot
    first_name: string;                   // Bot 的显示名称
    username: string;                     // Bot 的用户名，用于 t.me 链接
    can_join_groups: boolean;             // Bot 是否可以加入群组
    can_read_all_group_messages: boolean; // Bot 是否可以读取群组消息
    supports_inline_queries: boolean;      // Bot 是否支持内联查询
}

/**
 * Telegram Bot 服务类
 * 专注于处理与 Telegram Bot API 的通信
 */
export class TelegramBotService {
    // Telegram Bot API 的基础 URL
    private readonly baseUrl = 'https://api.telegram.org/bot';
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * 获取 Bot 的详细信息
     * 这是验证 Bot Token 和获取 Bot 信息的核心方法
     */
    async getMe(): Promise<TelegramApiResponse<BotInfo>> {
        try {
            // 构建完整的 API URL
            const apiUrl = `${this.baseUrl}${this.apiKey}/getMe`;

            // 发送请求到 Telegram 服务器
            const response = await fetch(apiUrl);
            const data = await response.json() as TelegramApiResponse<BotInfo>;

            // 验证返回的数据结构是否符合预期
            if (this.isValidBotResponse(data)) {
                return data;
            }

            throw new Error('Telegram API 返回了无效的数据结构');
        } catch (error) {
            console.error('获取 Bot 信息失败:', error);
            return {
                ok: false,
                description: error instanceof Error ? error.message : '获取 Bot 信息失败'
            };
        }
    }

    /**
     * 验证 Bot Token 是否有效
     * 这是一个便捷方法，实际上是调用 getMe 并检查结果
     */
    async validateApiKey(): Promise<{
        isValid: boolean;
        botInfo?: BotInfo;
        error?: string;
    }> {
        try {
            const response = await this.getMe();

            if (response.ok && response.result) {
                return {
                    isValid: true,
                    botInfo: response.result
                };
            }

            return {
                isValid: false,
                error: response.description || '验证失败'
            };
        } catch (error) {
            return {
                isValid: false,
                error: '验证过程中发生错误'
            };
        }
    }

    /**
     * 类型守卫：验证 API 响应的数据结构
     * 确保返回的数据符合我们预期的格式
     */
    private isValidBotResponse(data: unknown): data is TelegramApiResponse<BotInfo> {
        const response = data as TelegramApiResponse<BotInfo>;
        return (
            typeof response === 'object' &&
            response !== null &&
            typeof response.ok === 'boolean' &&
            (!response.result || this.isValidBotInfo(response.result))
        );
    }

    /**
     * 类型守卫：验证 Bot 信息的数据结构
     * 确保 Bot 信息包含所有必需的字段
     */
    private isValidBotInfo(data: unknown): data is BotInfo {
        const botInfo = data as BotInfo;
        return (
            typeof botInfo === 'object' &&
            botInfo !== null &&
            typeof botInfo.id === 'number' &&
            typeof botInfo.is_bot === 'boolean' &&
            typeof botInfo.first_name === 'string' &&
            typeof botInfo.username === 'string'
        );
    }
}

/**
 * 工厂函数：创建 TelegramBotService 的实例
 * 提供一个便捷的方式来创建服务实例
 */
export const createTelegramBotService = (apiKey: string) => {
    return new TelegramBotService(apiKey);
};