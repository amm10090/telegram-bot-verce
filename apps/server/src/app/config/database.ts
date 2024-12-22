// apps/server/src/config/database.ts

import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { EventEmitter } from 'events';

// 设置系统默认时区为中国时区
moment.tz.setDefault('Asia/Shanghai');

/**
 * 数据库连接状态接口定义
 */
interface DatabaseConnectionState {
    isConnected: boolean;          // 当前是否已连接
    lastConnectedAt: Date | null;  // 最后成功连接的时间
    reconnectAttempts: number;     // 重连尝试次数
    connectionErrors: string[];    // 连接错误历史记录
}

/**
 * 数据库配置管理类
 * 使用单例模式管理数据库配置
 */
class DatabaseConfig {
    private static instance: DatabaseConfig;
    private readonly options: mongoose.ConnectOptions;
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

    // 创建数据库连接选项
    private createConnectionOptions(): mongoose.ConnectOptions {
        const baseOptions: mongoose.ConnectOptions = {
            maxPoolSize: 10,
            minPoolSize: 2,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
            ssl: true,
            tls: true,
            authSource: 'admin',
            retryWrites: true,
            retryReads: true,
            autoIndex: process.env.NODE_ENV !== 'production'
        };

        return baseOptions;
    }

    // 获取配置信息
    getConfig() {
        return {
            uri: this.uri,
            options: this.options
        };
    }
}

/**
 * 数据库日志管理类
 * 统一处理所有数据库相关的日志记录
 */
class DatabaseLogger {
    private static formatMessage(message: string, meta?: any): string {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        const metaString = meta ? JSON.stringify(meta, null, 2) : '';
        return `[${timestamp}] ${message}${metaString}`;
    }

    static info(message: string, meta?: any): void {
        console.log(this.formatMessage(message, meta));
    }

    static error(message: string, error: any): void {
        console.error(this.formatMessage(message, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            time: new Date().toISOString()
        }));
    }

    static warn(message: string, meta?: any): void {
        console.warn(this.formatMessage(message, meta));
    }
}

/**
 * 数据库重连策略类
 * 实现智能的重连逻辑
 */
class ReconnectionStrategy {
    private readonly maxRetries: number;
    private readonly baseDelay: number;
    private readonly maxDelay: number;

    constructor(maxRetries = 5, baseDelay = 5000, maxDelay = 30000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    // 执行重连
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

    constructor(checkInterval = 30000) {
        this.checkInterval = checkInterval;
    }

    // 开始健康检查
    start(onUnhealthy: () => void): void {
        this.timeoutId = setInterval(async () => {
            try {
                // 首先检查连接状态
                if (mongoose.connection.readyState !== 1) {
                    throw new Error('数据库连接已断开');
                }

                // 确保 db 存在后再调用 ping
                const db = mongoose.connection.db;
                if (!db) {
                    throw new Error('数据库实例不可用');
                }

                // 执行 ping 操作
                await db.admin().ping();

                // 可以添加成功的日志
                DatabaseLogger.info('健康检查成功');

            } catch (error) {
                // 记录详细的错误信息
                DatabaseLogger.error('健康检查失败', {
                    error: error instanceof Error ? error.message : '未知错误',
                    connectionState: mongoose.connection.readyState,
                    timestamp: new Date().toISOString()
                });

                // 调用不健康回调
                onUnhealthy();
            }
        }, this.checkInterval);
    }

    // 停止健康检查
    stop(): void {
        if (this.timeoutId) {
            clearInterval(this.timeoutId);
            this.timeoutId = undefined;  // 清除引用
            DatabaseLogger.info('健康检查已停止');
        }
    }

    // 新增：手动触发一次健康检查
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
 * 核心类，管理整个数据库连接生命周期
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

    // 初始化数据库连接
    async initialize(): Promise<void> {
        try {
            await this.connect();
            this.setupEventHandlers();
            this.startHealthCheck();
        } catch (error) {
            DatabaseLogger.error('数据库初始化失败', error);
            throw error;
        }
    }

    // 连接数据库
    private async connect(): Promise<void> {
        if (this.state.isConnected) {
            DatabaseLogger.info('数据库已经连接');
            return;
        }

        const { uri, options } = this.config.getConfig();
        if (!uri) {
            throw new Error('未配置数据库连接URI');
        }

        await mongoose.connect(uri, options);
    }

    // 设置事件处理器
    private setupEventHandlers(): void {
        const connection = mongoose.connection;

        connection.on('connected', () => {
            this.updateState({
                isConnected: true,
                lastConnectedAt: new Date(),
                reconnectAttempts: 0
            });
            DatabaseLogger.info('数据库连接成功', {
                host: connection.host,
                port: connection.port,
                name: connection.name
            });
        });

        connection.on('error', (error) => {
            this.updateState({
                isConnected: false,
                connectionErrors: [...this.state.connectionErrors, error.message]
            });
            DatabaseLogger.error('数据库连接错误', error);
        });

        connection.on('disconnected', () => {
            this.updateState({ isConnected: false });
            DatabaseLogger.warn('数据库连接断开');
            if (process.env.NODE_ENV === 'development') {
                this.handleReconnection();
            }
        });
    }

    // 开始健康检查
    private startHealthCheck(): void {
        this.healthCheck.start(() => this.handleReconnection());
    }

    // 处理重连
    private async handleReconnection(): Promise<void> {
        try {
            await this.reconnectionStrategy.execute(
                () => this.connect(),
                (attempt, delay) => {
                    DatabaseLogger.info('尝试重新连接', { attempt, delay });
                }
            );
        } catch (error) {
            DatabaseLogger.error('重连失败', error);
        }
    }

    // 更新状态
    private updateState(updates: Partial<DatabaseConnectionState>): void {
        this.state = { ...this.state, ...updates };
        this.eventEmitter.emit('stateChanged', this.state);
    }

    // 获取状态
    getState(): DatabaseConnectionState {
        return { ...this.state };
    }

    // 监听状态变化
    onStateChange(callback: (state: DatabaseConnectionState) => void): void {
        this.eventEmitter.on('stateChanged', callback);
    }

    // 优雅关闭
    async gracefulShutdown(): Promise<void> {
        try {
            this.healthCheck.stop();
            DatabaseLogger.info('正在关闭数据库连接');
            await mongoose.connection.close();
            DatabaseLogger.info('数据库连接已安全关闭');
        } catch (error) {
            DatabaseLogger.error('关闭数据库连接时出错', error);
            throw error;
        }
    }
}

// 创建连接函数
const connectDatabase = async (): Promise<void> => {
    const manager = DatabaseConnectionManager.getInstance();
    await manager.initialize();

    // 设置进程退出处理
    process.on('SIGINT', async () => {
        await manager.gracefulShutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await manager.gracefulShutdown();
        process.exit(0);
    });
};

// 导出
export default connectDatabase;
export const getDatabaseStatus = () => {
    const manager = DatabaseConnectionManager.getInstance();
    const state = manager.getState();
    return {
        ...state,
        lastConnectedAt: state.lastConnectedAt
            ? moment(state.lastConnectedAt).format('YYYY-MM-DD HH:mm:ss')
            : null,
        errorHistory: state.connectionErrors.slice(-5)
    };
};