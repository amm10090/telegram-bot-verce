// services/monitoring.js
import { logger } from './logger';
import { dbManager } from '../core/database';
import { SystemConstants } from '../core/types';

class MonitoringService {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            messageCount: 0,
            errorCount: 0,
            lastError: null,
            lastPing: null,
            memoryUsage: 0,
            activeUsers: new Set()
        };

        this.healthChecks = new Map();
        this.alertThresholds = {
            errorRate: 0.1,          // 10% error rate threshold
            responseTime: 5000,       // 5 second response threshold
            memoryUsage: 512 * 1024 * 1024  // 512MB memory threshold
        };
    }

    async initialize() {
        try {
            // Set up periodic health checks
            this.setupHealthChecks();

            // Start monitoring memory usage
            this.startMemoryMonitoring();

            logger.info('监控服务初始化成功');
        } catch (error) {
            logger.error('监控服务初始化失败', error);
            throw error;
        }
    }

    setupHealthChecks() {
        // Database connectivity check
        this.registerHealthCheck('database', async () => {
            const isConnected = dbManager.isConnected();
            return {
                status: isConnected ? 'healthy' : 'unhealthy',
                details: { connected: isConnected }
            };
        });

        // Memory usage check
        this.registerHealthCheck('memory', async () => {
            const usage = process.memoryUsage();
            const heapUsed = usage.heapUsed / 1024 / 1024; // Convert to MB
            return {
                status: heapUsed < 512 ? 'healthy' : 'warning',
                details: { heapUsed: `${heapUsed.toFixed(2)} MB` }
            };
        });
    }

    registerHealthCheck(name, checkFn) {
        this.healthChecks.set(name, checkFn);
    }

    async runHealthChecks() {
        const results = {};
        for (const [name, checkFn] of this.healthChecks) {
            try {
                results[name] = await checkFn();
            } catch (error) {
                results[name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        return results;
    }

    startMemoryMonitoring() {
        setInterval(() => {
            const usage = process.memoryUsage();
            this.metrics.memoryUsage = usage.heapUsed;

            if (usage.heapUsed > this.alertThresholds.memoryUsage) {
                logger.warn('内存使用超过阈值', {
                    current: usage.heapUsed,
                    threshold: this.alertThresholds.memoryUsage
                });
            }
        }, 60000); // Check every minute
    }

    recordMessage(userId, messageType) {
        this.metrics.messageCount++;
        this.metrics.activeUsers.add(userId);
        this.metrics.lastPing = Date.now();
    }

    recordError(error) {
        this.metrics.errorCount++;
        this.metrics.lastError = {
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack
        };

        // Calculate error rate
        const totalOperations = this.metrics.messageCount + this.metrics.errorCount;
        const errorRate = this.metrics.errorCount / totalOperations;

        if (errorRate > this.alertThresholds.errorRate) {
            logger.warn('错误率超过阈值', {
                errorRate,
                threshold: this.alertThresholds.errorRate
            });
        }
    }

    async getStatus() {
        const uptime = Date.now() - this.metrics.startTime;
        const healthChecks = await this.runHealthChecks();

        return {
            status: 'active',
            uptime: Math.floor(uptime / 1000 / 60 / 60), // Convert to hours
            metrics: {
                messageCount: this.metrics.messageCount,
                errorCount: this.metrics.errorCount,
                activeUsers: this.metrics.activeUsers.size,
                memoryUsage: Math.floor(this.metrics.memoryUsage / 1024 / 1024), // Convert to MB
                lastError: this.metrics.lastError,
                lastPing: this.metrics.lastPing
            },
            healthChecks
        };
    }

    async reset() {
        this.metrics = {
            startTime: Date.now(),
            messageCount: 0,
            errorCount: 0,
            lastError: null,
            lastPing: null,
            memoryUsage: 0,
            activeUsers: new Set()
        };
        logger.info('监控指标已重置');
    }
}

export const monitoringService = new MonitoringService();