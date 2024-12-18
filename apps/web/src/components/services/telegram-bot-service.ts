// src/services/telegram-bot-service.ts

// 首先导入必要的类型
import { AxiosError } from 'axios';  // 如果你使用 axios

/**
 * 自定义错误类，用于处理 Telegram API 相关错误
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
 * 统一的错误响应接口
 */
interface ErrorResponse {
    message: string;
    statusCode?: number;
    details?: any;
}

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
 * 验证结果接口
 */
interface ValidationResult {
    isValid: boolean;
    error?: string;
    botInfo?: BotInfo;
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
 * 重试操作的辅助函数，包含错误处理
 */
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
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
class TelegramBotService {
    private baseUrl: string;
    private token: string;
    private timeout: number = 10000;

    constructor(token: string) {
        this.token = token;
        this.baseUrl = `/api/bot/telegram`;
    }

    /**
     * 处理 HTTP 错误
     */
    private handleHttpError(error: unknown): never {
        if (error instanceof Error) {
            if ('response' in error) {
                const response = (error as any).response;
                throw new TelegramApiError(
                    response?.data?.description || error.message,
                    response?.status
                );
            }
            throw new TelegramApiError(error.message);
        }
        throw new TelegramApiError('未知错误');
    }

    /**
     * 验证 API 密钥
     */
    async validateApiKey(): Promise<ValidationResult> {
        try {
            return await retryOperation(async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                try {
                    const response = await fetch(`${this.baseUrl}/validate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ token: this.token }),
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

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

                } catch (error) {
                    if ((error as Error).name === 'AbortError') {
                        return {
                            isValid: false,
                            error: '请求超时，请检查网络连接'
                        };
                    }
                    throw error;
                }
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
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                try {
                    const response = await fetch(`${this.baseUrl}/getMe`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ token: this.token }),
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new TelegramApiError(
                            `获取Bot信息失败: ${response.status} ${response.statusText}`,
                            response.status
                        );
                    }

                    return await response.json();
                } catch (error) {
                    if ((error as Error).name === 'AbortError') {
                        throw new TelegramApiError('获取Bot信息超时');
                    }
                    throw error;
                }
            });
        } catch (error) {
            this.handleHttpError(error);
        }
    }

    /**
     * 保存 API 密钥配置
     */
    async saveApiKey(config: ApiKeyConfig): Promise<boolean> {
        try {
            return await retryOperation(async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                try {
                    const response = await fetch(`${this.baseUrl}/saveKey`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(config),
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new TelegramApiError(
                            `保存失败: ${response.status} ${response.statusText}`,
                            response.status
                        );
                    }

                    const data = await response.json();
                    return data.ok;
                } catch (error) {
                    if ((error as Error).name === 'AbortError') {
                        throw new TelegramApiError('保存操作超时');
                    }
                    throw error;
                }
            });
        } catch (error) {
            return false;
        }
    }
}

/**
 * 创建 Telegram Bot 服务的工厂函数
 */
export function createTelegramBotService(token: string): TelegramBotService {
    return new TelegramBotService(token);
}