// apps/web/src/services/telegram-bot-service.ts

// 导入必要的类型和接口
import {
    ApiResponse,
    PaginatedApiResponse,
    BotInfo,
    Bot,
    RawBotData,
    EnhancedBotData,
    BotCreateUpdateData,
    BotApiResponse,
    BotListResponse
} from '../../types/bot';

// API配置常量，使用 const enum 提升性能
const enum ApiConfig {
    TIMEOUT = 10000,           // 请求超时时间：10秒
    RETRY_COUNT = 2,           // 重试次数：2次
    RETRY_BASE_DELAY = 1000,   // 基础重试延迟：1秒
    MAX_BATCH_SIZE = 100,      // 最大批处理大小
    CACHE_DURATION = 300000    // 缓存持续时间：5分钟
}

// 错误类型枚举，用于分类处理不同类型的错误
const enum ErrorType {
    NETWORK = 'NETWORK',     // 网络错误：连接问题、超时等
    VALIDATION = 'VALIDATION', // 验证错误：参数错误、格式错误等
    SERVER = 'SERVER',       // 服务器错误：500系列错误
    TIMEOUT = 'TIMEOUT',     // 超时错误：请求超时
    UNKNOWN = 'UNKNOWN'      // 未知错误：其他未分类错误
}

// HTTP状态码映射，用于统一状态码���理
const enum HttpStatus {
    OK = 200,               // 请求成功
    BAD_REQUEST = 400,      // 请求参数错误
    UNAUTHORIZED = 401,     // 未授权
    NOT_FOUND = 404,        // 资源未找到
    CONFLICT = 409,         // 资源冲突
    INTERNAL_SERVER = 500   // 服务器内部错误
}

// 自定义API错误类，用于统一错误处理
class ApiError extends Error {
    constructor(
        message: string,
        public readonly type: ErrorType,
        public readonly statusCode?: number,
        public readonly originalError?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    // 从HTTP响应创建错误实例
    static fromResponse(response: Response, data?: any): ApiError {
        const message = data?.message || 'API请求失败';
        const type = response.status >= 500 ? ErrorType.SERVER : ErrorType.VALIDATION;
        return new ApiError(message, type, response.status, data);
    }

    // 从普通错误转换为API错误
    static fromError(error: unknown): ApiError {
        if (error instanceof ApiError) return error;

        if (error instanceof Error && error.name === 'AbortError') {
            return new ApiError('请求已被取消', ErrorType.UNKNOWN, undefined, error);
        }

        const message = error instanceof Error ? error.message : '未知错误';
        const type = error instanceof TypeError ? ErrorType.NETWORK : ErrorType.UNKNOWN;

        return new ApiError(message, type, undefined, error);
    }
}

// HTTP请求客户端类，处理所有的HTTP请求逻辑
class ApiClient {
    private activeControllers: Map<string, AbortController>;
    private cache: Map<string, { data: any; timestamp: number }>;

    constructor(private readonly baseUrl: string) {
        this.activeControllers = new Map();
        this.cache = new Map();
    }

    // 生成请求的唯一标识符
    private generateRequestId(endpoint: string, method: string): string {
        return `${method}-${endpoint}-${Date.now()}`;
    }

    // 清理已完成的请求控制器
    private cleanupController(requestId: string): void {
        this.activeControllers.delete(requestId);
    }

    // 从缓存获取数据
    private getCachedData<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < ApiConfig.CACHE_DURATION) {
            return cached.data as T;
        }
        return null;
    }

    // 设置缓存数据
    private setCachedData(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // 发送API请求的公共方法
    public async request<T>(
        endpoint: string,
        method: string,
        body?: unknown,
        externalSignal?: AbortSignal
    ): Promise<ApiResponse<T>> {
        const requestId = this.generateRequestId(endpoint, method);
        const controller = new AbortController();

        this.activeControllers.set(requestId, controller);

        try {
            const signal = externalSignal
                ? this.combineSignals(externalSignal, controller.signal)
                : controller.signal;

            const url = `${this.baseUrl}${endpoint}`;
            const options = this.createRequestOptions(method, body, signal);

            const response = await this.retryWithBackoff(async () => {
                const res = await fetch(url, options);
                return this.handleResponse<T>(res);
            });

            return response;
        } finally {
            this.cleanupController(requestId);
        }
    }

    // 合并多个AbortSignal
    private combineSignals(...signals: AbortSignal[]): AbortSignal {
        const controller = new AbortController();

        signals.forEach(signal => {
            signal.addEventListener('abort', () => {
                controller.abort(signal.reason);
            });
        });

        return controller.signal;
    }

    // 创建请求配置
    private createRequestOptions(
        method: string,
        body?: unknown,
        signal?: AbortSignal
    ): RequestInit {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include',
        };

        if (signal) {
            options.signal = signal;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        return options;
    }

    // 处理API响应
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const contentType = response.headers.get('content-type');

        if (!contentType?.includes('application/json')) {
            throw new ApiError(
                '服务器返回了非预期的响应格式',
                ErrorType.SERVER,
                response.status
            );
        }

        const data = await response.json();

        if (!response.ok) {
            throw ApiError.fromResponse(response, data);
        }

        return {
            success: true,
            data,
            message: data.message || '操作成功'
        };
    }

    // 实现带有指数重试机制
    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        retryCount: number = ApiConfig.RETRY_COUNT
    ): Promise<T> {
        let lastError: ApiError | null = null;

        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    throw error;
                }

                const apiError = error instanceof ApiError
                    ? error
                    : ApiError.fromError(error);
                lastError = apiError;

                if (apiError.type === ErrorType.VALIDATION) {
                    throw apiError;
                }

                if (attempt === retryCount) {
                    throw apiError;
                }

                const delayMs = ApiConfig.RETRY_BASE_DELAY * Math.pow(2, attempt);
                const jitter = Math.random() * 100;
                await new Promise(resolve => setTimeout(resolve, delayMs + jitter));
            }
        }

        throw lastError ?? new ApiError('未知错误', ErrorType.UNKNOWN);
    }
}

// Telegram Bot服务类，理所有Bot相关的业务逻辑
export class TelegramBotService {
    private readonly client: ApiClient;
    private readonly logger: Console;

    constructor() {
        // 使用 NEXT_PUBLIC_ 前缀的环境变量
        const baseUrl = '/api/bot/telegram';
        this.client = new ApiClient(baseUrl);
        this.logger = console;
    }

    // 验证Bot Token
    async validateToken(
        token: string,
        signal?: AbortSignal
    ): Promise<ApiResponse<BotInfo>> {
        try {
            return await this.client.request<BotInfo>(
                '/validate',
                'POST',
                { token },
                signal
            );
        } catch (error) {
            this.logger.error('Token验证失败:', error);
            throw ApiError.fromError(error);
        }
    }

    // 获取Bot列表
    async getAllBots(
        params?: {
            status?: string;
            search?: string;
            page?: number;
            pageSize?: number;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        },
        signal?: AbortSignal
    ): Promise<BotListResponse> {
        try {
            const defaultParams = {
                page: 1,
                pageSize: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc' as const
            };

            const finalParams = {
                ...defaultParams,
                ...params
            };

            const queryParams = new URLSearchParams();
            Object.entries(finalParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });

            // 发送请求获取Bot列表
            const response = await this.client.request<RawBotData[]>(
                `/bots?${queryParams.toString()}`,
                'GET',
                undefined,
                signal
            );

            // 添加调试日志
            this.logger.debug('获取到的原始响应:', response);

            // 验证响应格式
            if (!this.isValidBotResponse(response)) {
                throw new ApiError(
                    '返回的数据格式不符合预期',
                    ErrorType.SERVER,
                    undefined,
                    response
                );
            }

            // 处理成功但数据为空的情况
            if (!response.success || !response.data) {
                return {
                    success: false,
                    data: [],
                    total: 0,
                    page: finalParams.page,
                    pageSize: finalParams.pageSize,
                    message: response.message || '暂无数据'
                };
            }

            // 确保 response.data 是数组
            const rawBots: RawBotData[] = Array.isArray(response.data) ? response.data : [];

            // 处理数据转换
            const processedBots = await Promise.all(
                rawBots.map(async rawBot => {
                    const enhancedBot = await this.enhanceBotData(rawBot);
                    return this.normalizeBot(enhancedBot);
                })
            );

            // 返回分页数据
            return {
                success: true,
                data: processedBots,
                page: finalParams.page,
                pageSize: finalParams.pageSize,
                total: processedBots.length,
                message: response.message || '获取成功'
            };

        } catch (error) {
            this.logger.error('获取Bot列表失败:', error);
            return this.handleBotError(error, 'getAllBots', {
                params,
                timestamp: new Date().toISOString()
            });
        }
    }

    // 创建新的Bot
    async createBot(
        data: BotCreateUpdateData,
        signal?: AbortSignal
    ): Promise<ApiResponse<Bot>> {
        try {
            return await this.client.request<Bot>(
                '/bots',
                'POST',
                data,
                signal
            );
        } catch (error) {
            this.logger.error('创建Bot失败:', error);
            throw ApiError.fromError(error);
        }
    }

    // 更新Bot信息
    async updateBot(
        id: string,
        data: Partial<Omit<Bot, 'id' | 'createdAt'>>,
        signal?: AbortSignal
    ): Promise<ApiResponse<Bot>> {
        try {
            return await this.client.request<Bot>(
                `/bots/${id}`,
                'PUT',
                data,
                signal
            );
        } catch (error) {
            this.logger.error('更新Bot失败:', error);
            throw ApiError.fromError(error);
        }
    }

    // 删除Bot
    async deleteBot(
        id: string,
        signal?: AbortSignal
    ): Promise<ApiResponse<void>> {
        try {
            return await this.client.request<void>(
                `/bots/${id}`,
                'DELETE',
                undefined,
                signal
            );
        } catch (error) {
            this.logger.error('删除Bot失败:', error);
            throw ApiError.fromError(error);
        }
    }

    // 私有辅助方法
    private isValidBotResponse(
        response: any
    ): response is ApiResponse<Bot[]> {
        // 首先检查基本的响应结构
        if (!response || typeof response !== 'object') {
            this.logger.warn('响���不是一个效的对象');
            return false;
        }

        // 检查 success 字段
        if (typeof response.success !== 'boolean') {
            this.logger.warn('响应中缺少 success 字段或类型不正确');
            return false;
        }

        // 如果响应表示失败，我们仍然认为这是一个有效的响应
        if (!response.success) {
            return true;
        }

        // 检查 data 字段
        if (!response.data) {
            this.logger.warn('响应中缺少 data 字段');
            return false;
        }

        // 检查 data 是否为数组
        if (!Array.isArray(response.data)) {
            // 尝试检查是否是嵌套的数据结构
            if (response.data.data && Array.isArray(response.data.data)) {
                response.data = response.data.data; // 新赋值到正确的结构
                return true;
            }
            this.logger.warn('data 字段不是数组');
            return false;
        }

        // 验证数组中的每个元素
        return response.data.every((item: any) => this.isValidRawBotData(item));
    }

    private isValidRawBotData(data: any): data is RawBotData {
        return (
            data &&
            (typeof data._id === 'string' || typeof data.id === 'string') &&
            typeof data.name === 'string' &&
            typeof data.apiKey === 'string' &&
            typeof data.isEnabled === 'boolean'
        );
    }

    private async enhanceBotData(rawBot: RawBotData): Promise<EnhancedBotData> {
        return {
            ...rawBot,
            metadata: {
                lastChecked: new Date().toISOString(),
                lastActive: rawBot.lastUsed
            }
        };
    }

    private handleBotError(
        error: unknown,
        context: string,
        meta?: any
    ): PaginatedApiResponse<Bot[]> {
        this.logger.error(`${context} 操作失败:`, {
            error,
            meta,
            timestamp: new Date().toISOString()
        });

        return {
            success: false,
            data: [],
            total: 0,
            page: 1,
            pageSize: 10,
            message: error instanceof Error ? error.message : '操作失败',
            error: ApiError.fromError(error)
        };
    }

    private normalizeBot(rawBot: RawBotData): Bot {
        const normalizedStatus = (rawBot.status === 'active' || rawBot.status === 'inactive')
            ? rawBot.status
            : (rawBot.isEnabled ? 'active' as const : 'inactive' as const);

        return {
            id: rawBot._id,
            name: rawBot.name,
            apiKey: rawBot.apiKey,
            isEnabled: rawBot.isEnabled,
            status: normalizedStatus,
            createdAt: rawBot.createdAt,
            lastUsed: rawBot.lastUsed
        };
    }
}

// 导出单例实例
export const telegramBotService = new TelegramBotService();