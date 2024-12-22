// apps/server/src/config/database.ts

import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { EventEmitter } from 'events';

// 设置系统默认时区为中国时区
moment.tz.setDefault('Asia/Shanghai');

/**
 * 自定义数据库错误接口定义
 * 用于统一处理和记录数据库相关的错误信息
 */
interface DatabaseError {
    name: string;           // 错误名称
    message: string;        // 错误信息
    code?: string | number; // 错误代码
    stack?: string;        // 错误堆栈
    timestamp?: string;    // 错误发生时间
}

/**
 * 扩展的MongoDB连接选项接口
 * 包含了一些MongoDB驱动新版本中可能不存在但仍然有用的选项
 */
interface ExtendedConnectOptions extends mongoose.ConnectOptions {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
}

/**
 * 数据库连接状态接口
 * 用于跟踪和记录数据库连接的完整状态信息
 */
interface DatabaseConnectionState {
    isConnected: boolean;                // 当前是否已连接
    lastConnectedAt: Date | null;        // 最后成功连接的时间
    reconnectAttempts: number;           // 重连尝试次数
    connectionErrors: DatabaseError[];    // 连接错误历史记录
    lastError?: DatabaseError;           // 最后一次错误信息
    connectionDetails?: {                // 连接详细信息
        host?: string;
        port?: number;
        database?: string;
    };
}

/**
 * 数据库配置管理类
 * 使用单例模式确保全局配置的一致性
 */
class DatabaseConfig {
    private static instance: DatabaseConfig;
    private readonly options: ExtendedConnectOptions;
    private readonly uri: string;

    private constructor() {
        this.uri = process.env.MONGODB_URI || '';
        this.options = this.createConnectionOptions();
    }

    static getInstance(): DatabaseConfig {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }

    private createConnectionOptions(): ExtendedConnectOptions {
        return {
            maxPoolSize: 10,                    // 连接池最大连接数
            minPoolSize: 2,                     // 连接池最小连接数
            connectTimeoutMS: 30000,            // 连接超时：30秒
            socketTimeoutMS: 45000,             // 套接字超时：45秒
            serverSelectionTimeoutMS: 30000,    // 服务器选择超时：30秒
            heartbeatFrequencyMS: 10000,        // 心跳频率：10秒
            ssl: true,                          // 启用SSL
            tls: true,                          // 启用TLS
            authSource: 'admin',                // 认证数据库
            retryWrites: true,                  // 启用写入重试
            retryReads: true,                   // 启用读取重试
            useNewUrlParser: true,              // 使用新的URL解析器
            useUnifiedTopology: true,           // 使用统一的拓扑结构
            autoIndex: process.env.NODE_ENV !== 'production' // 非生产环境自动创建索引
        };
    }

    getConfig() {
        return {
            uri: this.uri,
            options: this.options
        };
    }
}

/**
 * 数据库日志管理类
 * 提供统一的日志记录接口，支持不同级别的日志
 */
class DatabaseLogger {
    private static formatMessage(message: string, meta?: unknown): string {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        const metaString = meta ? JSON.stringify(meta, null, 2) : '';
        return `[${timestamp}] ${message}${metaString ? '\n' + metaString : ''}`;
    }

    private static formatErrorInfo(error: unknown): Record<string, any> {
        if (error instanceof Error) {
            return {
                message: error.message,
                stack: error.stack,
                name: error.name,
                timestamp: new Date().toISOString(),
                ...(error as any)
            };
        }

        if (typeof error === 'object' && error !== null) {
            return error as Record<string, any>;
        }

        return { message: String(error) };
    }

    static info(message: string, meta?: unknown): void {
        console.log(this.formatMessage(message, meta));
    }

    static error(message: string, error: DatabaseError | Error | unknown): void {
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

    constructor(
        maxRetries = 10,    // 最大重试次数：10次
        baseDelay = 10000,  // 基础延迟时间：10秒
        maxDelay = 60000    // 最大延迟时间：60秒
    ) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

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

                const delay = Math.min(
                    this.baseDelay * Math.pow(2, attempt - 1),
                    this.maxDelay
                );
                const jitter = Math.random() * 1000;
                const finalDelay = delay + jitter;

                onAttempt(attempt, finalDelay);
                await new Promise(resolve => setTimeout(resolve, finalDelay));
            }
        }
    }
}

/**
 * 数据库健康检查类
 * 定期监控数据库连接状态并触发相应的处理
 */
class DatabaseHealthCheck {
    private readonly checkInterval: number;
    private timeoutId?: NodeJS.Timeout;

    constructor(checkInterval = 30000) {
        this.checkInterval = checkInterval;
    }

    start(onUnhealthy: () => void): void {
        this.timeoutId = setInterval(async () => {
            try {
                if (mongoose.connection.readyState !== 1) {
                    throw new Error('数据库连接已断开');
                }

                const db = mongoose.connection.db;
                if (!db) {
                    throw new Error('数据库实例不可用');
                }

                await db.admin().ping();
                DatabaseLogger.debug('健康检查成功');

            } catch (error) {
                const errorInfo: DatabaseError = {
                    name: error instanceof Error ? error.name : 'UnknownError',
                    message: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString()
                };

                DatabaseLogger.error('健康检查失败', errorInfo);
                onUnhealthy();
            }
        }, this.checkInterval);
    }

    stop(): void {
        if (this.timeoutId) {
            clearInterval(this.timeoutId);
            this.timeoutId = undefined;
            DatabaseLogger.info('健康检查已停止');
        }
    }

    async checkNow(): Promise<boolean> {
        try {
            if (mongoose.connection.readyState !== 1) {
                return false;
            }

            const db = mongoose.connection.db;
            if (!db) {
                return false;
            }

            await db.admin().ping();
            return true;
        } catch (error) {
            DatabaseLogger.error('手动健康检查失败', error);
            return false;
        }
    }
}

/**
 * 数据库连接管理器类
 * 核心类，管理数据库连接的完整生命周期
 */
class DatabaseConnectionManager {
    private static instance: DatabaseConnectionManager;
    private readonly config: DatabaseConfig;
    private readonly healthCheck: DatabaseHealthCheck;
    private readonly reconnectionStrategy: ReconnectionStrategy;
    private readonly eventEmitter: EventEmitter;
    private state: DatabaseConnectionState;

    private constructor() {
        this.config = DatabaseConfig.getInstance();
        this.healthCheck = new DatabaseHealthCheck();
        this.reconnectionStrategy = new ReconnectionStrategy();
        this.eventEmitter = new EventEmitter();
        this.state = {
            isConnected: false,
            lastConnectedAt: null,
            reconnectAttempts: 0,
            connectionErrors: []
        };
    }

    static getInstance(): DatabaseConnectionManager {
        if (!DatabaseConnectionManager.instance) {
            DatabaseConnectionManager.instance = new DatabaseConnectionManager();
        }
        return DatabaseConnectionManager.instance;
    }

    private validateEnvironment(): void {
        const requiredEnvVars = ['MONGODB_URI', 'NODE_ENV'];
        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

        if (missing.length > 0) {
            throw new Error(`缺少必要的环境变量: ${missing.join(', ')}`);
        }

        const uri = process.env.MONGODB_URI;
        if (!uri?.startsWith('mongodb+srv://') && !uri?.startsWith('mongodb://')) {
            throw new Error('MongoDB URI 格式不正确');
        }
    }

    async initialize(): Promise<void> {
        try {
            this.validateEnvironment();
            await this.connect();
            this.setupEventHandlers();
            this.startHealthCheck();
        } catch (error) {
            const errorInfo: DatabaseError = {
                name: error instanceof Error ? error.name : 'InitializationError',
                message: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
            DatabaseLogger.error('数据库初始化失败', errorInfo);
            throw error;
        }
    }

    private async connect(): Promise<void> {
        if (this.state.isConnected) {
            DatabaseLogger.info('数据库已经连接');
            return;
        }

        const { uri, options } = this.config.getConfig();
        if (!uri) {
            throw new Error('未配置数据库连接URI');
        }

        try {
            DatabaseLogger.info('开始连接数据库', {
                host: new URL(uri).hostname,
                options: {
                    ...options,
                    ssl: options.ssl,
                    tls: options.tls
                }
            });

            await mongoose.connect(uri, options);

        } catch (error) {
            const errorInfo: DatabaseError & {
                connectionState: number;
                diagnosis?: string;
                suggestion?: string;
            } = {
                name: error instanceof Error ? error.name : 'ConnectionError',
                message: error instanceof Error ? error.message : String(error),
                connectionState: mongoose.connection.readyState,
                timestamp: new Date().toISOString()
            };

            if (errorInfo.name === 'MongoServerSelectionError') {
                errorInfo.diagnosis = '可能是网络连接问题或MongoDB Atlas IP白名单设置问题';
                errorInfo.suggestion = '请检查：1. 网络连接 2. IP白名单设置 3. 集群状态';
            }

            DatabaseLogger.error('数据库连接失败', errorInfo);
            throw error;
        }
    }

    private setupEventHandlers(): void {
        const connection = mongoose.connection;

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
            DatabaseLogger.info('数据库连接成功');
        });

        connection.on('error', (error: Error) => {
            const errorInfo: DatabaseError = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };

            this.updateState({
                isConnected: false,
                lastError: errorInfo,
                connectionErrors: [...this.state.connectionErrors, errorInfo].slice(-5)
            });
            DatabaseLogger.error('数据库连接错误', errorInfo);
        });

        connection.on('disconnected', () => {
            this.updateState({ isConnected: false });
            DatabaseLogger.warn('数据库连接断开');
            if (process.env.NODE_ENV === 'development') {
                this.handleReconnection();
            }
        });
    }

    private startHealthCheck(): void {
        this.healthCheck.start(() => this.handleReconnection());
    }

    private async handleReconnection(): Promise<void> {
        try {
            await this.reconnectionStrategy.execute(
                () => this.connect(),
                (attempt, delay) => {
                    this.updateState({ reconnectAttempts: attempt });
                    DatabaseLogger.info('尝试重新连接', { attempt, delay });
                }
            );
        } catch (error) {
            const errorInfo: DatabaseError = {
                name: error instanceof Error ? error.name : 'ReconnectionError',
                message: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
            DatabaseLogger.error('重连失败', errorInfo);
        }
    }

    private updateState(updates: Partial<DatabaseConnectionState>): void {
        this.state = { ...this.state, ...updates };
        this.eventEmitter.emit('stateChanged', this.state);
    }

    getState(): DatabaseConnectionState {
        return { ...this.state };
    }

    onStateChange(callback: (state: DatabaseConnectionState) => void): void {
        this.eventEmitter.on('stateChanged', callback);
    }

    async gracefulShutdown(): Promise<void> {
        try {
            this.healthCheck.stop();
            DatabaseLogger.info('正在关闭数据库连接');
            await mongoose.connection.close();
            DatabaseLogger.info('数据库连接已安全关闭');
        } catch (error) {
            const errorInfo: DatabaseError = {
                name: error instanceof Error ? error.name : 'ShutdownError',
                message: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
            DatabaseLogger.error('关闭数据库连接时出错', errorInfo);
            throw error;
        }
    }
}

/**
 * 创建并初始化数据库连接
 * 处理数据库连接的生命周期和进程退出
 */
const connectDatabase = async (): Promise<void> => {
    const manager = DatabaseConnectionManager.getInstance();

    try {
        await manager.initialize();

        // 设置进程退出处理
        process.on('SIGINT', async () => {
            DatabaseLogger.info('接收到 SIGINT 信号，开始安全关闭数据库连接');
            await manager.gracefulShutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            DatabaseLogger.info('接收到 SIGTERM 信号，开始安全关闭数据库连接');
            await manager.gracefulShutdown();
            process.exit(0);
        });

    } catch (error) {
        DatabaseLogger.error('数据库连接初始化失败', {
            name: error instanceof Error ? error.name : 'InitializationError',
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
        });
        throw error;
    }
};

/**
 * 获取格式化的数据库状态信息
 * 返回人类可读的数据库连接状态和统计信息
 */
export const getDatabaseStatus = () => {
    const manager = DatabaseConnectionManager.getInstance();
    const state = manager.getState();

    return {
        ...state,
        // 格式化时间为人类可读格式
        lastConnectedAt: state.lastConnectedAt
            ? moment(state.lastConnectedAt).format('YYYY-MM-DD HH:mm:ss')
            : null,
        // 只保留最近的错误记录
        errorHistory: state.connectionErrors.slice(-5).map(error => ({
            ...error,
            timestamp: moment(error.timestamp).format('YYYY-MM-DD HH:mm:ss')
        })),
        // 当前连接状态的描述
        connectionStatus: state.isConnected ? '已连接' : '未连接',
        // 监控信息
        monitoring: {
            readyState: mongoose.connection.readyState,
            connectionTime: state.lastConnectedAt
                ? moment(state.lastConnectedAt).fromNow()
                : '未连接',
            reconnectAttempts: state.reconnectAttempts,
            host: state.connectionDetails?.host || '未知',
            database: state.connectionDetails?.database || '未知'
        }
    };
};

// 导出默认的数据库连接函数和状态查询函数
export default connectDatabase;