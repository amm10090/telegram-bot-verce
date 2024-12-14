// services/monitoring.js

import { logger } from './logger.js';
import { dbManager } from '../api/database.js';
import { SystemConstants } from '../api/types.js';

class MonitoringService {
    constructor() {
        // 基础指标
        this.metrics = {
            startTime: Date.now(),
            messageCount: 0,
            errorCount: 0,
            lastError: null,
            lastPing: null,
            memoryUsage: 0,
            activeUsers: new Set(),
            // 性能指标
            performance: {
                apiLatency: new Map(),
                dbQueryTimes: new Map(),
                requestCount: 0,
                averageResponseTime: 0
            },
            // 资源使用
            resources: {
                cpuUsage: 0,
                memoryUsed: 0,
                memoryTotal: 0,
                diskUsage: 0,
                networkIO: {
                    bytesIn: 0,
                    bytesOut: 0
                }
            },
            // 请求统计
            requests: {
                total: 0,
                success: 0,
                failed: 0,
                rateLimited: 0
            }
        };

        // 健康检查配置
        this.healthChecks = new Map();

        // 警报阈值配置
        this.alertThresholds = {
            errorRate: 0.1,          // 10% 错误率阈值
            responseTime: 5000,       // 5秒响应时间阈值
            memoryUsage: 512 * 1024 * 1024,  // 512MB 内存阈值
            cpuUsage: 80,            // 80% CPU 使用率阈值
            diskSpace: 90            // 90% 磁盘使用率阈值
        };

        // 性能采样配置
        this.samplingConfig = {
            interval: 60000,         // 采样间隔（毫秒）
            retentionPeriod: 86400000, // 数据保留时间（24小时）
            sampleSize: 100          // 采样大小
        };

        // 性能数据存储
        this.performanceHistory = [];
    }

    /**
     * 初始化监控服务
     */
    async initialize() {
        try {
            // 设置定期健康检查
            this.setupHealthChecks();

            // 启动资源监控
            this.startResourceMonitoring();

            // 启动性能数据采集
            this.startPerformanceSampling();

            // 初始化数据存储
            await this.initializeStorage();

            logger.info('监控服务初始化成功');
        } catch (error) {
            logger.error('监控服务初始化失败', error);
            throw error;
        }
    }

    /**
     * 设置健康检查
     */
    setupHealthChecks() {
        // 数据库连接检查
        this.registerHealthCheck('database', async () => {
            const isConnected = dbManager.isConnected();
            return {
                status: isConnected ? 'healthy' : 'unhealthy',
                details: { connected: isConnected },
                timestamp: Date.now()
            };
        });

        // 内存使用检查
        this.registerHealthCheck('memory', async () => {
            const usage = process.memoryUsage();
            const heapUsed = usage.heapUsed / 1024 / 1024;
            return {
                status: heapUsed < this.alertThresholds.memoryUsage ? 'healthy' : 'warning',
                details: {
                    heapUsed: `${heapUsed.toFixed(2)} MB`,
                    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`
                },
                timestamp: Date.now()
            };
        });

        // API 响应时间检查
        this.registerHealthCheck('api', async () => {
            const avgLatency = this.calculateAverageLatency();
            return {
                status: avgLatency < this.alertThresholds.responseTime ? 'healthy' : 'warning',
                details: { averageLatency: `${avgLatency.toFixed(2)}ms` },
                timestamp: Date.now()
            };
        });
    }

    /**
     * 注册新的健康检查
     */
    registerHealthCheck(name, checkFn) {
        this.healthChecks.set(name, checkFn);
        logger.info(`注册新的健康检查: ${name}`);
    }

    /**
     * 启动资源监控
     */
    startResourceMonitoring() {
        setInterval(() => {
            try {
                const usage = process.memoryUsage();
                this.metrics.resources.memoryUsed = usage.heapUsed;
                this.metrics.resources.memoryTotal = usage.heapTotal;

                // 检查是否超过阈值
                if (usage.heapUsed > this.alertThresholds.memoryUsage) {
                    this.triggerAlert('memory', {
                        current: usage.heapUsed,
                        threshold: this.alertThresholds.memoryUsage
                    });
                }

                // 更新CPU使用率
                this.updateCPUUsage();

            } catch (error) {
                logger.error('资源监控更新失败', error);
            }
        }, 60000); // 每分钟检查一次
    }

    /**
     * 启动性能数据采样
     */
    startPerformanceSampling() {
        setInterval(() => {
            try {
                const sample = {
                    timestamp: Date.now(),
                    metrics: { ...this.metrics },
                    resources: { ...this.metrics.resources }
                };

                this.performanceHistory.push(sample);

                // 清理过期数据
                this.cleanupHistoricalData();

            } catch (error) {
                logger.error('性能数据采样失败', error);
            }
        }, this.samplingConfig.interval);
    }

    /**
     * 记录消息
     */
    recordMessage(userId, messageType) {
        this.metrics.messageCount++;
        this.metrics.activeUsers.add(userId);
        this.metrics.lastPing = Date.now();

        // 更新请求统计
        this.metrics.requests.total++;
        this.metrics.requests.success++;
    }

    /**
     * 记录错误
     */
    recordError(error) {
        this.metrics.errorCount++;
        this.metrics.lastError = {
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack
        };

        // 更新请求统计
        this.metrics.requests.failed++;

        // 计算错误率并检查是否需要报警
        const errorRate = this.calculateErrorRate();
        if (errorRate > this.alertThresholds.errorRate) {
            this.triggerAlert('error_rate', {
                current: errorRate,
                threshold: this.alertThresholds.errorRate
            });
        }
    }

    /**
     * 记录API延迟
     */
    recordLatency(endpoint, duration) {
        const latencies = this.metrics.performance.apiLatency.get(endpoint) || [];
        latencies.push(duration);

        // 只保留最近的采样
        if (latencies.length > this.samplingConfig.sampleSize) {
            latencies.shift();
        }

        this.metrics.performance.apiLatency.set(endpoint, latencies);

        // 更新平均响应时间
        this.updateAverageResponseTime();
    }

    /**
     * 触发警报
     */
    async triggerAlert(type, data) {
        try {
            logger.warn(`系统警报: ${type}`, data);

            // 记录警报到数据库
            const alertCollection = await dbManager.getCollection('alerts');
            await alertCollection.insertOne({
                type,
                data,
                timestamp: new Date(),
                status: 'active'
            });

            // TODO: 实现警报通知（邮件、短信等）

        } catch (error) {
            logger.error('触发警报失败', error);
        }
    }

    /**
     * 获取系统状态
     */
    async getStatus() {
        const uptime = Date.now() - this.metrics.startTime;
        const healthChecks = await this.runHealthChecks();

        return {
            status: this.determineOverallStatus(healthChecks),
            uptime: Math.floor(uptime / 1000 / 60 / 60), // 转换为小时
            metrics: {
                messageCount: this.metrics.messageCount,
                errorCount: this.metrics.errorCount,
                activeUsers: this.metrics.activeUsers.size,
                memoryUsage: Math.floor(this.metrics.resources.memoryUsed / 1024 / 1024),
                cpuUsage: this.metrics.resources.cpuUsage,
                requestStats: {
                    total: this.metrics.requests.total,
                    success: this.metrics.requests.success,
                    failed: this.metrics.requests.failed,
                    successRate: this.calculateSuccessRate()
                }
            },
            performance: {
                averageResponseTime: this.metrics.performance.averageResponseTime,
                requestCount: this.metrics.performance.requestCount
            },
            lastError: this.metrics.lastError,
            lastPing: this.metrics.lastPing,
            healthChecks
        };
    }

    /**
     * 执行所有健康检查
     */
    async runHealthChecks() {
        const results = {};
        for (const [name, checkFn] of this.healthChecks) {
            try {
                results[name] = await checkFn();
            } catch (error) {
                results[name] = {
                    status: 'error',
                    error: error.message,
                    timestamp: Date.now()
                };
            }
        }
        return results;
    }

    /**
     * 清理历史数据
     */
    cleanupHistoricalData() {
        const cutoffTime = Date.now() - this.samplingConfig.retentionPeriod;
        this.performanceHistory = this.performanceHistory.filter(
            sample => sample.timestamp > cutoffTime
        );
    }

    /**
     * 计算错误率
     */
    calculateErrorRate() {
        const total = this.metrics.requests.total;
        if (total === 0) return 0;
        return this.metrics.requests.failed / total;
    }

    /**
     * 计算成功率
     */
    calculateSuccessRate() {
        const total = this.metrics.requests.total;
        if (total === 0) return 100;
        return (this.metrics.requests.success / total) * 100;
    }

    /**
     * 计算平均延迟
     */
    calculateAverageLatency() {
        let totalLatency = 0;
        let count = 0;

        for (const latencies of this.metrics.performance.apiLatency.values()) {
            totalLatency += latencies.reduce((sum, val) => sum + val, 0);
            count += latencies.length;
        }

        return count === 0 ? 0 : totalLatency / count;
    }

    /**
     * 更新平均响应时间
     */
    updateAverageResponseTime() {
        const avgLatency = this.calculateAverageLatency();
        this.metrics.performance.averageResponseTime = avgLatency;

        if (avgLatency > this.alertThresholds.responseTime) {
            this.triggerAlert('response_time', {
                current: avgLatency,
                threshold: this.alertThresholds.responseTime
            });
        }
    }

    /**
     * 更新CPU使用率
     */
    updateCPUUsage() {
        try {
            const startUsage = process.cpuUsage();
            setTimeout(() => {
                const endUsage = process.cpuUsage(startUsage);
                const totalUsage = (endUsage.user + endUsage.system) / 1000000; // 转换为秒
                this.metrics.resources.cpuUsage = totalUsage;

                if (totalUsage > this.alertThresholds.cpuUsage) {
                    this.triggerAlert('cpu_usage', {
                        current: totalUsage,
                        threshold: this.alertThresholds.cpuUsage
                    });
                }
            }, 100);
        } catch (error) {
            logger.error('CPU使用率更新失败', error);
        }
    }

    /**
     * 初始化存储
     */
    async initializeStorage() {
        try {
            const db = await dbManager.connect();
            await db.createCollection('monitoring');
            await db.collection('monitoring').createIndex({ timestamp: 1 });
            await db.collection('monitoring').createIndex({ type: 1 });
        } catch (error) {
            logger.error('监控存储初始化失败', error);
            throw error;
        }
    }

    /**
     * 确定整体系统状态
     */
    determineOverallStatus(healthChecks) {
        const statuses = Object.values(healthChecks).map(check => check.status);

        if (statuses.includes('error')) return 'error';
        if (statuses.includes('unhealthy')) return 'unhealthy';
        if (statuses.includes('warning')) return 'warning';
        return 'healthy';
    }

    /**
     * 重置监控指标
     */
    async reset() {
        this.metrics = {
            startTime: Date.now(),
            messageCount: 0,
            errorCount: 0,
            lastError: null,
            lastPing: null,
            memoryUsage: 0,
            activeUsers: new Set(),
            performance: {
                apiLatency: new Map(),
                dbQueryTimes: new Map(),
                requestCount: 0,
                averageResponseTime: 0
            },
            resources: {
                cpuUsage: 0,
                memoryUsed: 0,
                memoryTotal: 0,
                diskUsage: 0,
                networkIO: {
                    bytesIn: 0,
                    bytesOut: 0
                }
            },
            requests: {
                total: 0,
                success: 0,
                failed: 0,
                rateLimited: 0
            }
        };

        this.performanceHistory = [];
        try {
            // 记录重置操作
            await dbManager.getCollection('monitoring').insertOne({
                type: 'reset',
                timestamp: new Date(),
                reason: 'manual_reset'
            });

            logger.info('监控指标已重置');
        } catch (error) {
            logger.error('重置监控指标失败', error);
            throw error;
        }
    }

    /**
     * 获取性能历史数据
     * @param {number} hours - 获取最近多少小时的数据
     * @returns {Array} 性能历史数据
     */
    getPerformanceHistory(hours = 24) {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return this.performanceHistory.filter(sample => sample.timestamp > cutoffTime);
    }

    /**
     * 获取当前系统负载详情
     * @returns {Object} 系统负载信息
     */
    getSystemLoad() {
        return {
            cpuUsage: this.metrics.resources.cpuUsage,
            memoryUsage: {
                used: this.metrics.resources.memoryUsed,
                total: this.metrics.resources.memoryTotal,
                percentage: (this.metrics.resources.memoryUsed / this.metrics.resources.memoryTotal * 100).toFixed(2)
            },
            network: this.metrics.resources.networkIO,
            requests: {
                ...this.metrics.requests,
                successRate: this.calculateSuccessRate()
            }
        };
    }

    /**
     * 导出监控数据（用于报告生成）
     * @param {Date} startDate - 开始日期
     * @param {Date} endDate - 结束日期
     * @returns {Promise<Object>} 导出的监控数据
     */
    async exportMonitoringData(startDate, endDate) {
        try {
            const collection = await dbManager.getCollection('monitoring');
            const data = await collection.find({
                timestamp: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).toArray();

            return {
                period: {
                    start: startDate,
                    end: endDate
                },
                metrics: {
                    messageCount: this.metrics.messageCount,
                    errorCount: this.metrics.errorCount,
                    activeUsers: this.metrics.activeUsers.size
                },
                performance: {
                    averageResponseTime: this.metrics.performance.averageResponseTime,
                    errorRate: this.calculateErrorRate(),
                    successRate: this.calculateSuccessRate()
                },
                resources: this.getSystemLoad(),
                history: data
            };
        } catch (error) {
            logger.error('导出监控数据失败', error);
            throw error;
        }
    }

    /**
     * 更新警报阈值
     * @param {Object} newThresholds - 新的阈值配置
     */
    updateAlertThresholds(newThresholds) {
        this.alertThresholds = {
            ...this.alertThresholds,
            ...newThresholds
        };
        logger.info('警报阈值已更新', this.alertThresholds);
    }
}

// 创建并导出监控服务实例
const monitoringService = new MonitoringService();
export { monitoringService };