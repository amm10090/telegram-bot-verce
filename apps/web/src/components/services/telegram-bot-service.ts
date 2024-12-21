// apps/web/src/services/telegram-bot-service.ts

// 导入必要的类型定义
import type { BotInfo } from '../../types/bot';

/**
 * API 配置对象
 * 定义了所有 API 相关的基础配置
 */
const API_CONFIG = {
    // API 基础URL，如果环境变量未设置则使用空字符串
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
    // 请求超时时间（毫秒）
    TIMEOUT: 10000,
    // 失败重试次数
    RETRY_COUNT: 3,
    // 重试延迟时间（毫秒）
    RETRY_DELAY: 1000,
};

/**
 * API 响应的标准格式
 * 使用泛型T来定义响应数据的类型
 */
interface ApiResponse<T = any> {
    success: boolean;        // 请求是否成功
    data?: T;               // 响应数据
    message?: string;       // 错误信息
    error?: any;           // 错误详情
}

/**
 * Bot数据接口
 * 定义了Bot的基本信息结构
 */
interface Bot {
    id: string;             // Bot唯一标识符
    name: string;           // Bot名称
    apiKey: string;         // API密钥
    isEnabled: boolean;     // 是否启用
    status: 'active' | 'inactive';  // Bot状态
    createdAt: string;      // 创建时间
    lastUsed?: string;      // 最后使用时间
}

/**
 * 自定义API错误类
 * 用于统一错误处理
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
 * API服务类
 * 处理所有与后端API的通信
 */
export class TelegramBotService {
    private readonly baseUrl: string;

    constructor() {
        // 设置API基础路径
        this.baseUrl = `${API_CONFIG.BASE_URL}/api/bot/telegram`;
    }

    /**
     * 创建请求配置
     * 设置请求头和超时控制
     */
    private createRequestOptions(method: string, body?: any): RequestInit {
        // 创建超时控制器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

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
     * 处理API请求
     * 统一处理请求错误和重试逻辑
     */
    private async fetchWithRetry<T>(
        endpoint: string,
        options: RequestInit
    ): Promise<ApiResponse<T>> {
        let lastError: Error | null = null;

        // 重试机制
        for (let i = 0; i < API_CONFIG.RETRY_COUNT; i++) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, options);
                const data = await response.json();

                if (!response.ok) {
                    throw new TelegramApiError(
                        data.message || `请求失败: ${response.status}`,
                        response.status,
                        data
                    );
                }

                return data;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.error(`请求失败，尝试重试 (${i + 1}/${API_CONFIG.RETRY_COUNT}):`, error);

                if (i < API_CONFIG.RETRY_COUNT - 1) {
                    await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
                }
            }
        }

        throw lastError || new Error('请求失败，已达到最大重试次数');
    }

    /**
     * 验证Bot Token
     * 检查Token是否有效
     */
    async validateToken(token: string): Promise<ApiResponse<BotInfo>> {
        const options = this.createRequestOptions('POST', { token });
        return this.fetchWithRetry<BotInfo>('/validate', options);
    }

    /**
     * 创建新的Bot
     * 保存Bot配置到系统
     */
    async createBot(data: {
        name: string;
        apiKey: string;
        isEnabled: boolean;
    }): Promise<ApiResponse<Bot>> {
        const options = this.createRequestOptions('POST', data);
        return this.fetchWithRetry<Bot>('/bots', options);
    }

    /**
     * 获取所有Bot列表
     * 支持分页和筛选
     */
    async getAllBots(params?: {
        status?: string;
        search?: string;
    }): Promise<ApiResponse<Bot[]>> {
        const queryString = params
            ? '?' + new URLSearchParams(params as Record<string, string>).toString()
            : '';
        const options = this.createRequestOptions('GET');
        return this.fetchWithRetry<Bot[]>(`/bots${queryString}`, options);
    }

    /**
     * 更新Bot信息
     * 修改Bot的配置
     */
    async updateBot(
        id: string,
        data: Partial<Omit<Bot, 'id' | 'createdAt'>>
    ): Promise<ApiResponse<Bot>> {
        const options = this.createRequestOptions('PUT', data);
        return this.fetchWithRetry<Bot>(`/bots/${id}`, options);
    }

    /**
     * 删除Bot
     * 从系统中移除Bot配置
     */
    async deleteBot(id: string): Promise<ApiResponse<void>> {
        const options = this.createRequestOptions('DELETE');
        return this.fetchWithRetry<void>(`/bots/${id}`, options);
    }
}

// 创建服务实例
export const telegramBotService = new TelegramBotService();