// apps/web/src/services/telegram-bot-service.ts

/**
 * API 基础配置
 */
const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
    TIMEOUT: 10000,
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000,
};

/**
 * Telegram API 响应的标准格式
 */
export interface TelegramApiResponse<T> {
    ok: boolean;
    result?: T;
    description?: string;
    error_code?: number;
}

/**
 * Bot 的基本信息接口
 */
export interface BotInfo {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
}

/**
 * API 密钥配置接口
 */
export interface ApiKeyConfig {
    token: string;
    name: string;
    enabled: boolean;
}

/**
 * 验证结果接口
 */
interface ValidationResult {
    isValid: boolean;
    error?: string;
    botInfo?: BotInfo;
}

/**
 * 自定义错误类
 */
class TelegramApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: any
    ) {
        super(message);
        this.name = 'TelegramApiError';
    }
}

/**
 * 重试操作的辅助函数
 */
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = API_CONFIG.RETRY_COUNT,
    delay: number = API_CONFIG.RETRY_DELAY
): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.log(`重试操作失败 (${i + 1}/${maxRetries}):`, error);

            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('操作失败，已达到最大重试次数');
}

/**
 * Telegram Bot 服务类
 */
export class TelegramBotService {
    private readonly baseUrl: string;
    private readonly token: string;
    private readonly timeout: number;

    constructor(token: string) {
        this.token = token;
        this.baseUrl = `${API_CONFIG.BASE_URL}/api/bot/telegram`;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    /**
     * 创建请求选项
     */
    private createRequestOptions(method: string, body?: any): RequestInit {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return options;
    }

    /**
     * 验证 API 密钥
     */
    async validateApiKey(): Promise<ValidationResult> {
        try {
            return await retryOperation(async () => {
                const options = this.createRequestOptions('POST', { token: this.token });

                const response = await fetch(`${this.baseUrl}/validate`, options);

                if (!response.ok) {
                    return {
                        isValid: false,
                        error: `服务器响应错误: ${response.status} ${response.statusText}`
                    };
                }

                const data: TelegramApiResponse<BotInfo> = await response.json();

                if (!data.ok) {
                    return {
                        isValid: false,
                        error: data.description || '验证失败'
                    };
                }

                return {
                    isValid: true,
                    botInfo: data.result
                };
            });
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : '验证过程发生未知错误'
            };
        }
    }

    /**
     * 获取 Bot 信息
     */
    async getMe(): Promise<TelegramApiResponse<BotInfo>> {
        try {
            return await retryOperation(async () => {
                const options = this.createRequestOptions('POST', { token: this.token });
                const response = await fetch(`${this.baseUrl}/getMe`, options);

                if (!response.ok) {
                    throw new TelegramApiError(
                        `获取Bot信息失败: ${response.status} ${response.statusText}`,
                        response.status
                    );
                }

                return await response.json();
            });
        } catch (error) {
            throw new TelegramApiError(
                error instanceof Error ? error.message : '获取Bot信息失败'
            );
        }
    }

    /**
     * 保存 API 密钥
     */
    async saveApiKey(config: ApiKeyConfig): Promise<boolean> {
        try {
            return await retryOperation(async () => {
                const options = this.createRequestOptions('POST', config);
                const response = await fetch(`${this.baseUrl}/saveKey`, options);

                if (!response.ok) {
                    throw new TelegramApiError(
                        `保存失败: ${response.status} ${response.statusText}`,
                        response.status
                    );
                }

                const data = await response.json();
                return data.ok;
            });
        } catch (error) {
            console.error('保存API密钥失败:', error);
            return false;
        }
    }
}

/**
 * 创建服务实例的工厂函数
 */
export const createTelegramBotService = (token: string): TelegramBotService => {
    return new TelegramBotService(token);
};