// apps/server/src/app/config/telegram-bot-service.ts

// 导入必要的 node-fetch，用于在服务器端发起 HTTP 请求
import fetch from 'node-fetch';

/**
 * Telegram API 响应的通用接口
 * 使用泛型 T 来定义不同类型响应的数据结构
 */
interface TelegramApiResponse<T> {
    ok: boolean;                // 是否请求成功
    result?: T;                 // 成功时的返回数据，类型由泛型 T 决定
    description?: string;       // 错误描述信息
    error_code?: number;        // 错误代码
}

/**
 * Bot 信息的接口定义
 * 描述了 Telegram Bot 的基本信息结构
 */
interface BotInfo {
    id: number;                           // Bot 的唯一标识符
    is_bot: boolean;                      // 是否是 Bot
    first_name: string;                   // Bot 的显示名称
    username: string;                     // Bot 的用户名
    can_join_groups: boolean;             // 是否可以加入群组
    can_read_all_group_messages: boolean; // 是否可以读取所有群组消息
    supports_inline_queries: boolean;      // 是否支持内联查询
}

/**
 * API 密钥配置接口
 * 定义了保存 API 密钥时需要的配置信息
 */
interface ApiKeyConfig {
    token: string;    // Bot Token
    name: string;     // Bot 名称
    enabled: boolean; // 是否启用
}

/**
 * Telegram Bot 服务类
 * 处理与 Telegram Bot API 的所有交互
 */
export class TelegramBotService {
    private baseUrl = 'https://api.telegram.org/bot';
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * 获取 Bot 信息
     * 通过调用 Telegram getMe API 获取 Bot 的详细信息
     */
    async getMe(): Promise<TelegramApiResponse<BotInfo>> {
        try {
            const response = await fetch(`${this.baseUrl}${this.apiKey}/getMe`);
            // 使用类型断言确保返回的数据符合预期的类型结构
            const data = await response.json() as TelegramApiResponse<BotInfo>;

            // 验证返回的数据结构
            if (this.isValidBotResponse(data)) {
                return data;
            }

            throw new Error('Invalid API response structure');
        } catch (error) {
            console.error('获取Bot信息失败:', error);
            // 返回统一的错误响应格式
            return {
                ok: false,
                description: error instanceof Error ? error.message : '获取Bot信息失败'
            };
        }
    }

    /**
     * 验证 API 密钥是否有效
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
     * 保存 API 密钥配置到系统
     * @param config API 密钥配置信息
     */
    async saveApiKey(config: ApiKeyConfig): Promise<boolean> {
        try {
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

            // 使用类型断言确保返回的数据是布尔值
            const data = await response.json() as { success: boolean };
            return data.success;
        } catch (error) {
            console.error('保存API密钥失败:', error);
            return false;
        }
    }

    /**
     * 获取已保存的 API 密钥列表
     */
    async getApiKeys(): Promise<ApiKeyConfig[]> {
        try {
            const response = await fetch('/api/settings/telegram-bot');
            if (!response.ok) {
                throw new Error('获取API密钥失败');
            }
            // 使用类型断言确保返回的数据是 ApiKeyConfig 数组
            const data = await response.json() as ApiKeyConfig[];

            // 验证返回的数据结构
            if (this.isValidApiKeyConfigArray(data)) {
                return data;
            }

            throw new Error('Invalid API key configuration data');
        } catch (error) {
            console.error('获取API密钥失败:', error);
            return [];
        }
    }

    /**
     * 类型守卫：验证响应是否是有效的 Bot 响应
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
     * 类型守卫：验证是否是有效的 Bot 信息
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

    /**
     * 类型守卫：验证是否是有效的 API 密钥配置数组
     */
    private isValidApiKeyConfigArray(data: unknown): data is ApiKeyConfig[] {
        return (
            Array.isArray(data) &&
            data.every(item => this.isValidApiKeyConfig(item))
        );
    }

    /**
     * 类型守卫：验证是否是有效的 API 密钥配置
     */
    private isValidApiKeyConfig(data: unknown): data is ApiKeyConfig {
        const config = data as ApiKeyConfig;
        return (
            typeof config === 'object' &&
            config !== null &&
            typeof config.token === 'string' &&
            typeof config.name === 'string' &&
            typeof config.enabled === 'boolean'
        );
    }
}

/**
 * 创建 Telegram Bot 服务的工厂函数
 */
export const createTelegramBotService = (apiKey: string) => {
    return new TelegramBotService(apiKey);
};