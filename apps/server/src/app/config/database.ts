// apps/server/src/app/config/database.ts

import mongoose, {
    Connection,
    ConnectOptions,
    ConnectionStates,
    Model,
    Document
} from 'mongoose';
import { EventEmitter } from 'events';
import moment from 'moment-timezone';

// 设置默认时区为中国时区
moment.tz.setDefault('Asia/Shanghai');

/**
 * 自定义数据库错误接口
 * 为错误处理提供统一的结构
 */
interface DatabaseError {
    name: string;
    message: string;
    code?: string | number;
    stack?: string;
    timestamp: string;
    details?: Record<string, any>;
}

/**
 * 扩展的 MongoDB 连接选项
 * 包含了我们需要的所有配置选项
 */
interface ExtendedConnectOptions extends ConnectOptions {
    maxPoolSize?: number;
    minPoolSize?: number;
    connectTimeoutMS?: number;
    socketTimeoutMS?: number;
    heartbeatFrequencyMS?: number;
    serverSelectionTimeoutMS?: number;
    ssl?: boolean;
    tls?: boolean;
    authSource?: string;
    retryWrites?: boolean;
    retryReads?: boolean;
}

/**
 * 数据库连接状态接口
 * 用于监控和报告数据库连接状态
 */
interface DatabaseConnectionState {
    isConnected: boolean;
    lastConnectedAt: Date | null;
    reconnectAttempts: number;
    connectionErrors: DatabaseError[];
    lastError?: DatabaseError;
    connectionDetails?: {
        host?: string;
        port?: number;
        database?: string;
    };
}

/**
 * 缓存数据接口
 * 为缓存项定义标准结构
 */
interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

/**
 * 数据库缓存管理类
 * 实现内存缓存以减少数据库访问
 */
class DatabaseCache {
    private static instance: DatabaseCache;
    private cache: Map<string, CacheItem<any>>;
    private readonly defaultTTL: number;

    private constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 默认5分钟过期
    }

    static getInstance(): DatabaseCache {
        if (!DatabaseCache.instance) {
            DatabaseCache.instance = new DatabaseCache();
        }
        return DatabaseCache.instance;
    }

    /**
     * 设置缓存
     * @param key - 缓存键
     * @param data - 要缓存的数据
     * @param ttl - 过期时间（毫秒）
     */
    set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
        const timestamp = Date.now();
        this.cache.set(key, {
            data,
            timestamp,
            expiresAt: timestamp + ttl
        });
    }

    /**
     * 获取缓存数据
     * @param key - 缓存键
     * @returns 缓存的数据或null（如果不存在或已过期）
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    /**
     * 清除特定缓存
     * @param key - 要清除的缓存键
     */
    clear(key: string): void {
        this.cache.delete(key);
    }

    /**
     * 清除所有缓存
     */
    clearAll(): void {
        this.cache.clear();
    }

    /**
     * 获取缓存统计信息
     */
    getStats(): Record<string, any> {
        const now = Date.now();
        let activeItems = 0;
        let expiredItems = 0;

        this.cache.forEach(item => {
            if (now <= item.expiresAt) {
                activeItems++;
            } else {
                expiredItems++;
            }
        });

        return {
            totalItems: this.cache.size,
            activeItems,
            expiredItems
        };
    }
}

/**
 * 数据库配置管理类
 * 负责管理数据库连接的配置信息
 */
class DatabaseConfig {
    private static instance: DatabaseConfig;
    private readonly uri: string;
    private readonly options: ExtendedConnectOptions;

    private constructor() {
        this.uri = process.env.MONGODB_URI || '';
        this.options = this.createConnectionOptions();

        // 验证配置
        this.validateConfig();
    }

    static getInstance(): DatabaseConfig {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }

    /**
     * 创建数据库连接选项
     * 根据环境配置不同的连接参数
     */
    private createConnectionOptions(): ExtendedConnectOptions {
        const isProd = process.env.NODE_ENV === 'production';

        return {
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
            minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '2'),
            connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000'),
            socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
            serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '30000'),
            heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY || '10000'),
            ssl: isProd,
            tls: isProd,
            authSource: 'admin',
            retryWrites: true,
            retryReads: true,
            autoIndex: !isProd
        };
    }

    /**
     * 验证配置的有效性
     * 确保必要的配置项存在且有效
     */
    private validateConfig(): void {
        if (!this.uri) {
            throw new Error('数据库 URI 未配置');
        }

        const uriPattern = /^mongodb(\+srv)?:\/\/.+/;
        if (!uriPattern.test(this.uri)) {
            throw new Error('数据库 URI 格式无效');
        }

        // 验证连接选项的有效性
        Object.entries(this.options).forEach(([key, value]) => {
            if (typeof value === 'number' && isNaN(value)) {
                throw new Error(`无效的配置值: ${key}`);
            }
        });
    }

    /**
     * 获取配置信息
     */
    getConfig(): { uri: string; options: ExtendedConnectOptions } {
        return {
            uri: this.uri,
            options: { ...this.options }
        };
    }

    /**
     * 获取格式化的配置信息
     * 用于日志和调试
     */
    getFormattedConfig(): Record<string, any> {
        const { uri, options } = this.getConfig();
        return {
            uri: uri.replace(/\/\/[^@]+@/, '//***:***@'),  // 隐藏敏感信息
            options: {
                ...options,
                ssl: options.ssl,
                tls: options.tls
            }
        };
    }
}

/**
 * 数据库日志管理类
 * 提供统一的日志记录接口，支持不同级别的日志
 */
class DatabaseLogger {
    /**
     * 格式化日志消息
     * 统一日志格式，包含时间戳和元数据
     */
    private static formatMessage(message: string, meta?: unknown): string {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        const metaString = meta ? JSON.stringify(meta, null, 2) : '';
        return `[${timestamp}] ${message}${metaString ? '\n' + metaString : ''}`;
    }

    /**
     * 格式化错误信息
     * 将各种类型的错误转换为标准格式
     */
    /**
        * 格式化错误信息
        * 将各种类型的错误转换为标准格式
        * @public 现在这是一个公共方法，可以被其他地方调用
        */
    public static formatErrorInfo(error: unknown): DatabaseError {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
                timestamp: moment().toISOString(),
                details: {
                    ...(error as any)
                }
            };
        }

        return {
            name: 'UnknownError',
            message: String(error),
            timestamp: moment().toISOString(),
            details: { originalError: error }
        };
    }


    static info(message: string, meta?: unknown): void {
        console.log(this.formatMessage(message, meta));
    }

    static error(message: string, error: unknown): void {
        const errorInfo = this.formatErrorInfo(error);
        console.error(this.formatMessage(message, errorInfo));
    }

    static warn(message: string, meta?: unknown): void {
        console.warn(this.formatMessage(message, meta));
    }

    static debug(message: string, meta?: unknown): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage(message, meta));
        }
    }
}

/**
 * 数据库重连策略类
 * 实现指数退避算法的重连机制
 */
class ReconnectionStrategy {
    private readonly maxRetries: number;
    private readonly baseDelay: number;
    private readonly maxDelay: number;
    private readonly jitterFactor: number;

    constructor(
        maxRetries: number = 3,
        baseDelay: number = 1000,
        maxDelay: number = 60000,
        jitterFactor: number = 0.1
    ) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
        this.jitterFactor = jitterFactor;
    }

    /**
     * 计算重试延迟时间
     * 使用指数退避算法并添加随机抖动
     */
    private calculateDelay(attempt: number): number {
        const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
        const delay = Math.min(exponentialDelay, this.maxDelay);
        const jitter = delay * this.jitterFactor * Math.random();
        return delay + jitter;
    }

    /**
     * 执行重连
     * 包含重试逻辑和错误处理
     */
    async execute(
        connectFn: () => Promise<void>,
        onAttempt: (attempt: number, delay: number) => void
    ): Promise<void> {
        let attempt = 0;

        while (attempt < this.maxRetries) {
            try {
                await connectFn();
                return;
            } catch (error) {
                attempt++;

                if (attempt === this.maxRetries) {
                    throw error;
                }

                const delay = this.calculateDelay(attempt);
                onAttempt(attempt, delay);

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

/**
 * 数据库健康检查类
 * 定期监控数据库连接状态
 */
class DatabaseHealthCheck {
    private readonly checkInterval: number;
    private timeoutId?: NodeJS.Timeout;
    private readonly metricsCollector: DatabaseMetricsCollector;

    constructor(checkInterval: number = 30000) {
        this.checkInterval = checkInterval;
        this.metricsCollector = new DatabaseMetricsCollector();
    }

    /**
     * 开始健康检查
     * 定期执行数据库状态检查
     */
    start(onUnhealthy: () => void): void {
        this.timeoutId = setInterval(async () => {
            try {
                const isHealthy = await this.performHealthCheck();
                this.metricsCollector.recordHealthCheck(isHealthy);

                if (!isHealthy) {
                    DatabaseLogger.warn('数据库健康检查失败');
                    onUnhealthy();
                }
            } catch (error) {
                DatabaseLogger.error('健康检查过程中发生错误', error);
                onUnhealthy();
            }
        }, this.checkInterval);
    }

    /**
     * 执行健康检查
     * 验证数据库连接和基本操作
     */
    private async performHealthCheck(): Promise<boolean> {
        if (mongoose.connection.readyState !== 1) {
            return false;
        }

        try {
            // 添加类型检查以确保 db 存在
            const db = mongoose.connection.db;
            if (!db) {
                DatabaseLogger.error('数据库实例不可用', new Error('Database instance is undefined'));
                return false;
            }

            // 执行 ping 命令来验证连接
            await db.command({ ping: 1 });
            return true;
        } catch (error) {
            DatabaseLogger.error('数据库 ping 失败', error);
            return false;
        }
    }

    /**
     * 停止健康检查
     */
    stop(): void {
        if (this.timeoutId) {
            clearInterval(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    /**
     * 获取健康检查指标
     */
    getMetrics(): Record<string, any> {
        return this.metricsCollector.getMetrics();
    }
}

/**
 * 数据库指标收集器类
 * 收集和管理数据库性能指标
 */
class DatabaseMetricsCollector {
    private metrics: {
        totalChecks: number;
        successfulChecks: number;
        failedChecks: number;
        lastCheckTime: Date | null;
        lastCheckStatus: boolean | null;
    };

    constructor() {
        this.metrics = {
            totalChecks: 0,
            successfulChecks: 0,
            failedChecks: 0,
            lastCheckTime: null,
            lastCheckStatus: null
        };
    }

    /**
     * 记录健康检查结果
     */
    recordHealthCheck(isHealthy: boolean): void {
        this.metrics.totalChecks++;
        if (isHealthy) {
            this.metrics.successfulChecks++;
        } else {
            this.metrics.failedChecks++;
        }
        this.metrics.lastCheckTime = new Date();
        this.metrics.lastCheckStatus = isHealthy;
    }

    /**
     * 获取指标数据
     */
    getMetrics(): Record<string, any> {
        return {
            ...this.metrics,
            healthCheckSuccessRate: this.calculateSuccessRate(),
            lastCheckTimeFormatted: this.metrics.lastCheckTime
                ? moment(this.metrics.lastCheckTime).format('YYYY-MM-DD HH:mm:ss')
                : null
        };
    }

    /**
     * 计算健康检查成功率
     */
    private calculateSuccessRate(): number {
        if (this.metrics.totalChecks === 0) return 100;
        return (this.metrics.successfulChecks / this.metrics.totalChecks) * 100;
    }
}

/**
 * 数据库连接管理器类
 * 这个类是整个数据库管理系统的核心，负责管理数据库连接的完整生命周期
 */
class DatabaseConnectionManager {
    private static instance: DatabaseConnectionManager;
    private readonly config: DatabaseConfig;
    private readonly healthCheck: DatabaseHealthCheck;
    private readonly reconnectionStrategy: ReconnectionStrategy;
    private readonly eventEmitter: EventEmitter;
    private readonly cache: DatabaseCache;
    private state: DatabaseConnectionState;
    private connectionPool: mongoose.Connection[];
    private readonly maxPoolSize: number;

    private constructor() {
        // 初始化必要的组件和配置
        this.config = DatabaseConfig.getInstance();
        this.healthCheck = new DatabaseHealthCheck();
        this.reconnectionStrategy = new ReconnectionStrategy();
        this.eventEmitter = new EventEmitter();
        this.cache = DatabaseCache.getInstance();
        this.maxPoolSize = 10;
        this.connectionPool = [];

        // 初始化连接状态
        this.state = {
            isConnected: false,
            lastConnectedAt: null,
            reconnectAttempts: 0,
            connectionErrors: []
        };

        // 设置事件监听器的最大数量
        this.eventEmitter.setMaxListeners(15);
    }

    /**
     * 获取单例实例
     * 确保整个应用中只有一个连接管理器实例
     */
    static getInstance(): DatabaseConnectionManager {
        if (!DatabaseConnectionManager.instance) {
            DatabaseConnectionManager.instance = new DatabaseConnectionManager();
        }
        return DatabaseConnectionManager.instance;
    }

    /**
     * 获取数据库连接
     * 从连接池中获取可用连接，如果没有则创建新连接
     */
    async getConnection(): Promise<mongoose.Connection> {
        try {
            // 查找可用的现有连接
            const availableConnection = this.connectionPool.find(
                conn => conn.readyState === mongoose.ConnectionStates.connected
            );

            if (availableConnection) {
                return availableConnection;
            }

            // 如果没有可用连接且未达到最大连接数，创建新连接
            if (this.connectionPool.length < this.maxPoolSize) {
                const newConnection = await this.createNewConnection();
                this.connectionPool.push(newConnection);
                return newConnection;
            }

            // 等待可用连接
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('获取数据库连接超时'));
                }, 30000);

                const checkInterval = setInterval(() => {
                    const conn = this.connectionPool.find(
                        c => c.readyState === mongoose.ConnectionStates.connected
                    );
                    if (conn) {
                        clearInterval(checkInterval);
                        clearTimeout(timeout);
                        resolve(conn);
                    }
                }, 100);
            });
        } catch (error) {
            DatabaseLogger.error('获取数据库连接失败', error);
            throw error;
        }
    }

    /**
     * 创建新的数据库连接
     * 配置并建立新的数据库连接
     */
    private async createNewConnection(): Promise<mongoose.Connection> {
        const { uri, options } = this.config.getConfig();
        const connection = await mongoose.createConnection(uri, options);

        // 设置连接事件处理
        this.setupConnectionEvents(connection);

        return connection;
    }

    /**
     * 设置连接事件监听器
     * 监听和处理各种数据库连接事件
     */
    private setupConnectionEvents(connection: mongoose.Connection): void {
        connection.on('connected', () => {
            this.updateState({
                isConnected: true,
                lastConnectedAt: new Date(),
                reconnectAttempts: 0,
                connectionDetails: {
                    host: connection.host,
                    port: connection.port,
                    database: connection.name
                }
            });
            DatabaseLogger.info('数据库连接成功', {
                host: connection.host,
                database: connection.name
            });
        });

        connection.on('error', (error: Error) => {
            const errorInfo = DatabaseLogger.formatErrorInfo(error);
            this.updateState({
                isConnected: false,
                lastError: errorInfo,
                connectionErrors: [...this.state.connectionErrors, errorInfo].slice(-5)
            });
            DatabaseLogger.error('数据库连接错误', error);
        });

        connection.on('disconnected', () => {
            this.updateState({ isConnected: false });
            DatabaseLogger.warn('数据库连接断开');
            this.handleReconnection();
        });
    }

    /**
     * 处理数据库重连
     * 使用重连策略尝试重新建立连接
     */
    private async handleReconnection(): Promise<void> {
        try {
            await this.reconnectionStrategy.execute(
                async () => {
                    await this.connect();
                },
                (attempt, delay) => {
                    this.updateState({ reconnectAttempts: attempt });
                    DatabaseLogger.info('尝试重新连接', { attempt, delay });
                }
            );
        } catch (error) {
            DatabaseLogger.error('重连失败', error);
            this.eventEmitter.emit('reconnectionFailed', error);
        }
    }

    /**
     * 更新连接状态
     * 维护当前的连接状态并触发相关事件
     */
    private updateState(updates: Partial<DatabaseConnectionState>): void {
        this.state = { ...this.state, ...updates };
        this.eventEmitter.emit('stateChanged', this.state);
    }

    /**
     * 初始化数据库连接
     * 包括环境验证、连接建立和监控启动
     */
    async initialize(): Promise<void> {
        try {
            // 验证环境配置
            this.validateEnvironment();

            // 建立初始连接
            await this.connect();

            // 启动健康检查
            this.startHealthCheck();

            // 注册进程退出处理
            this.setupProcessHandlers();

            DatabaseLogger.info('数据库管理器初始化完成');
        } catch (error) {
            DatabaseLogger.error('数据库初始化失败', error);
            throw error;
        }
    }

    /**
     * 验证环境配置
     * 确保所有必要的环境变量都已正确设置
     */
    private validateEnvironment(): void {
        const requiredEnvVars = ['MONGODB_URI', 'NODE_ENV'];
        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

        if (missing.length > 0) {
            throw new Error(`缺少必要的环境变量: ${missing.join(', ')}`);
        }

        const uri = process.env.MONGODB_URI;
        if (!uri?.startsWith('mongodb')) {
            throw new Error('MongoDB URI 格式不正确');
        }
    }

    /**
     * 建立数据库连接
     * 实际执行连接操作
     */
    private async connect(): Promise<void> {
        try {
            const { uri, options } = this.config.getConfig();
            await mongoose.connect(uri, options);
            DatabaseLogger.info('数据库连接成功');
        } catch (error) {
            DatabaseLogger.error('数据库连接失败', error);
            throw error;
        }
    }

    /**
     * 启动健康检查
     * 配置和启动数据库健康监控
     */
    private startHealthCheck(): void {
        this.healthCheck.start(() => this.handleReconnection());
        DatabaseLogger.info('健康检查监控已启动');
    }

    /**
     * 配置进程退出处理
     * 确保在进程退出时正确关闭数据库连接
     */
    private setupProcessHandlers(): void {
        const handleExit = async () => {
            await this.gracefulShutdown();
            process.exit(0);
        };

        process.on('SIGINT', handleExit);
        process.on('SIGTERM', handleExit);
        process.on('SIGQUIT', handleExit);
    }

    /**
     * 优雅关闭
     * 确保所有连接都被正确关闭
     */
    async gracefulShutdown(): Promise<void> {
        try {
            DatabaseLogger.info('开始关闭数据库连接...');

            // 停止健康检查
            this.healthCheck.stop();

            // 关闭所有连接池中的连接
            await Promise.all(
                this.connectionPool.map(conn => conn.close())
            );
            this.connectionPool = [];

            // 关闭主连接
            await mongoose.connection.close();

            DatabaseLogger.info('数据库连接已安全关闭');
        } catch (error) {
            DatabaseLogger.error('关闭数据库连接时出错', error);
            throw error;
        }
    }

    /**
     * 获取当前连接状态
     */
    getState(): DatabaseConnectionState {
        return { ...this.state };
    }

    /**
     * 注册状态变化监听器
     */
    onStateChange(callback: (state: DatabaseConnectionState) => void): void {
        this.eventEmitter.on('stateChanged', callback);
    }
}

/**
 * 创建并初始化数据库连接
 * 这是模块的主要导出函数，提供了简单的接口来启动数据库连接
 */
async function connectDatabase(): Promise<void> {
    const manager = DatabaseConnectionManager.getInstance();

    try {
        await manager.initialize();
        DatabaseLogger.info('数据库连接已初始化完成');
    } catch (error) {
        DatabaseLogger.error('数据库连接初始化失败', error);
        throw error;
    }
}

/**
 * 导出所需的类和函数
 */
export {
    DatabaseConnectionManager,
    DatabaseCache,
    DatabaseError,
    DatabaseConnectionState,
    connectDatabase as default
};