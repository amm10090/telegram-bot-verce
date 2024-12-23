// apps/server/src/app/services/health-check.service.ts

import mongoose from 'mongoose';
import moment from 'moment-timezone';
import fetch from 'node-fetch';

/**
 * 服务健康状态接口
 * 定义了各个服务的健康状态信息结构
 */
interface ServiceHealth {
    status: 'healthy' | 'unhealthy' | 'degraded';  // 服务状态
    latency?: number;                              // 响应延迟（毫秒）
    lastChecked: string;                           // 最后检查时间
    details?: Record<string, any>;                 // 详细信息
    error?: string;                                // 错误信息
}

/**
 * 完整的健康状态接口
 * 包含所有需要监控的服务的状态信息
 */
interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';  // 整体状态
    timestamp: string;                             // 检查时间戳
    environment: string;                           // 运行环境
    services: {
        server: ServiceHealth;                     // 服务器状态
        database: ServiceHealth;                   // 数据库状态
        telegramApi: ServiceHealth;                // Telegram API 状态
    };
    system: {
        uptime: string;                           // 运行时间
        memory: {                                 // 内存使用情况
            total: number;
            used: number;
            free: number;
            usagePercentage: number;
        };
        cpu: {                                    // CPU 使用情况
            cores: number;
            loadAverage: number[];
        };
    };
}

/**
 * 健康检查服务类
 * 负责检查和聚合所有服务的健康状态
 */
export class HealthCheckService {
    private static instance: HealthCheckService;

    private constructor() { }

    /**
     * 获取服务实例（单例模式）
     */
    static getInstance(): HealthCheckService {
        if (!HealthCheckService.instance) {
            HealthCheckService.instance = new HealthCheckService();
        }
        return HealthCheckService.instance;
    }

    /**
     * 格式化时间为中国时区
     */
    private formatTime(date: Date = new Date()): string {
        return moment(date).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss.SSS [GMT+8]');
    }

    /**
     * 格式化运行时间
     */
    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}天`);
        if (hours > 0) parts.push(`${hours}小时`);
        if (minutes > 0) parts.push(`${minutes}分钟`);
        if (remainingSeconds > 0) parts.push(`${remainingSeconds}秒`);

        return parts.join(' ');
    }

    /**
     * 检查数据库健康状态
     * 包含了完整的类型检查和错误处理
     */
    private async checkDatabaseHealth(): Promise<ServiceHealth> {
        const startTime = Date.now();
        try {
            // 首先检查连接状态
            if (mongoose.connection.readyState !== 1) {
                throw new Error('数据库未连接');
            }

            // 检查 db 实例是否存在
            const db = mongoose.connection.db;
            if (!db) {
                throw new Error('数据库实例不可用');
            }

            // 现在可以安全地使用 db 实例
            await db.admin().ping();

            return {
                status: 'healthy',
                latency: Date.now() - startTime,
                lastChecked: this.formatTime(),
                details: {
                    host: mongoose.connection.host,
                    name: mongoose.connection.name,
                    state: mongoose.connection.readyState,
                    // 添加更多的连接信息
                    connectionState: {
                        readyState: mongoose.connection.readyState,
                        states: mongoose.STATES,
                        modelNames: Object.keys(mongoose.connection.models)
                    }
                }
            };
        } catch (error) {
            // 提供更详细的错误信息
            const errorMessage = error instanceof Error
                ? error.message
                : '数据库检查失败';

            return {
                status: 'unhealthy',
                latency: Date.now() - startTime,
                lastChecked: this.formatTime(),
                error: errorMessage,
                details: {
                    connectionState: mongoose.connection.readyState,
                    // 添加额外的诊断信息
                    diagnosis: this.getDatabaseDiagnosis(error)
                }
            };
        }
    }

    /**
     * 获取数据库错误的诊断信息
     * 帮助识别具体的数据库问题
     */
    private getDatabaseDiagnosis(error: unknown): string {
        if (error instanceof Error) {
            // 根据不同的错误类型提供具体的诊断信息
            if (error.message.includes('connect ECONNREFUSED')) {
                return '数据库服务器连接被拒绝，可能是服务未启动或网络问题';
            }
            if (error.message.includes('Authentication failed')) {
                return '数据库认证失败，请检查凭证配置';
            }
            if (error.message.includes('topology was destroyed')) {
                return '数据库连接已断开，需要重新建立连接';
            }
            return `数据库错误：${error.message}`;
        }
        return '未知的数据库错误';
    }

    /**
     * 检查 Telegram API 健康状态
     */
    private async checkTelegramApiHealth(): Promise<ServiceHealth> {
        const startTime = Date.now();
        try {
            // 使用测试 token 检查 API 可用性
            // 注意：这里使用一个无效的 token 仅测试 API 响应，不需要真实的 token
            const response = await fetch('https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/getMe', {
                method: 'GET',
                timeout: 5000  // 5秒超时
            });

            // 即使返回 401，只要 API 响应了就认为服务是可用的
            const isAvailable = response.status === 401;  // 401 表示 API 正常工作但 token 无效

            return {
                status: isAvailable ? 'healthy' : 'unhealthy',
                latency: Date.now() - startTime,
                lastChecked: this.formatTime(),
                details: {
                    statusCode: response.status,
                    statusText: response.statusText
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                latency: Date.now() - startTime,
                lastChecked: this.formatTime(),
                error: error instanceof Error ? error.message : 'Telegram API 检查失败'
            };
        }
    }

    /**
     * 获取系统资源使用状况
     */
    private getSystemMetrics() {
        const totalMemory = process.memoryUsage().heapTotal;
        const usedMemory = process.memoryUsage().heapUsed;
        const freeMemory = totalMemory - usedMemory;

        return {
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usagePercentage: (usedMemory / totalMemory) * 100
            },
            cpu: {
                cores: require('os').cpus().length,
                loadAverage: require('os').loadavg()
            }
        };
    }

    /**
     * 获取完整的健康状态报告
     */
    async getFullHealthStatus(): Promise<HealthStatus> {
        // 并行检查所有服务
        const [dbHealth, telegramApiHealth] = await Promise.all([
            this.checkDatabaseHealth(),
            this.checkTelegramApiHealth()
        ]);

        // 获取系统指标
        const systemMetrics = this.getSystemMetrics();

        // 确定整体系统状态
        const services = {
            server: {
                status: 'healthy' as const,
                lastChecked: this.formatTime(),
                details: {
                    nodeVersion: process.version,
                    platform: process.platform
                }
            },
            database: dbHealth,
            telegramApi: telegramApiHealth
        };

        // 如果任何关键服务不健康，整体状态就是不健康的
        const overallStatus = Object.values(services).some(s => s.status === 'unhealthy')
            ? 'unhealthy'
            : Object.values(services).some(s => s.status === 'degraded')
                ? 'degraded'
                : 'healthy';

        return {
            status: overallStatus,
            timestamp: this.formatTime(),
            environment: process.env.NODE_ENV || 'development',
            services,
            system: {
                uptime: this.formatUptime(process.uptime()),
                ...systemMetrics
            }
        };
    }
}

// 导出单例实例
export const healthCheckService = HealthCheckService.getInstance();