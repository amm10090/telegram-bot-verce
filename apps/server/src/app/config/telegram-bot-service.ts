// src/services/telegram-bot-service.ts

/**
 * Telegram Bot API 响应的基础接口
 */
interface TelegramApiResponse<T> {
    ok: boolean;
    result?: T;
    description?: string;
    error_code?: number;
}

/**
 * Bot信息接口
 */
interface BotInfo {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
}

/**
 * API密钥配置接口
 */
interface ApiKeyConfig {
    token: string;
    name: string;
    enabled: boolean;
}

/**
 * Telegram Bot服务类
 * 负责处理与Telegram Bot API的所有交互
 */
export class TelegramBotService {
    private baseUrl = 'https://api.telegram.org/bot';
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * 验证API密钥是否有效
     * @returns 返回Promise<boolean>表示验证结果
     */
    async validateApiKey(): Promise<boolean> {
        try {
            const response = await this.getMe();
            return response.ok;
        } catch (error) {
            console.error('API密钥验证失败:', error);
            return false;
        }
    }

    /**
     * 获取Bot信息
     * @returns 返回Promise<TelegramApiResponse<BotInfo>>
     */
    async getMe(): Promise<TelegramApiResponse<BotInfo>> {
        try {
            const response = await fetch(`${this.baseUrl}${this.apiKey}/getMe`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取Bot信息失败:', error);
            throw error;
        }
    }

    /**
     * 保存API密钥到Vercel环境变量
     * @param config API密钥配置
     * @returns 返回Promise<boolean>表示保存结果
     */
    async saveApiKey(config: ApiKeyConfig): Promise<boolean> {
        try {
            // 这里应该调用你的后端API来保存环境变量
            const response = await fetch('/api/settings/telegram-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });

            if (!response.ok) {
                throw new Error('保存API密钥失败');
            }

            return true;
        } catch (error) {
            console.error('保存API密钥失败:', error);
            return false;
        }
    }

    /**
     * 从Vercel环境变量获取API密钥
     * @returns 返回Promise<ApiKeyConfig[]>
     */
    async getApiKeys(): Promise<ApiKeyConfig[]> {
        try {
            const response = await fetch('/api/settings/telegram-bot');
            if (!response.ok) {
                throw new Error('获取API密钥失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取API密钥失败:', error);
            return [];
        }
    }
}

// 导出服务实例
export const createTelegramBotService = (apiKey: string) => {
    return new TelegramBotService(apiKey);
};