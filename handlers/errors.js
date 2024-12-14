// handlers/errors.js

import { logger } from '../services/logger.js';
import { monitoringService } from '../services/monitoring.js';
import { BotError, DatabaseError, ValidationError, SystemConstants } from '../api/types.js';

class ErrorHandler {
    constructor() {
        // 初始化错误类型映射
        this.errorTypeHandlers = new Map([
            [BotError, this.handleBotError],
            [DatabaseError, this.handleDatabaseError],
            [ValidationError, this.handleValidationError]
        ]);

        // 初始化错误重试配置
        this.retryConfig = {
            maxRetries: SystemConstants.MAX_RETRIES,
            retryDelay: SystemConstants.RETRY_DELAY,
            timeout: SystemConstants.DEFAULT_TIMEOUT
        };

        // 初始化错误计数器
        this.errorCounters = new Map();
        this.lastReset = Date.now();

        // 定期重置错误计数器
        setInterval(() => this.resetErrorCounters(), 3600000); // 每小时重置
    }

    /**
     * 处理各类错误
     * @param {Error} error - 错误对象
     * @param {Object} ctx - Telegraf 上下文对象（可选）
     * @returns {Promise<void>}
     */
    async handle(error, ctx = null) {
        try {
            // 记录错误到监控服务
            await this.recordError(error);

            // 获取对应的错误处理函数
            const handler = this.errorTypeHandlers.get(error.constructor) || this.handleGenericError;

            // 判断是否需要重试
            if (this.shouldRetry(error)) {
                return await this.retryOperation(() => handler.call(this, error, ctx));
            }

            // 执行错误处理
            await handler.call(this, error, ctx);

        } catch (handlingError) {
            // 如果错误处理过程中出现新错误，记录为严重错误
            logger.error('错误处理过程失败', {
                originalError: error,
                handlingError: handlingError,
                context: ctx ? {
                    chatId: ctx.chat?.id,
                    userId: ctx.from?.id
                } : null
            });
        }
    }

    /**
     * 记录错误信息
     * @param {Error} error - 错误对象
     */
    async recordError(error) {
        // 更新错误计数
        const errorType = error.constructor.name;
        this.errorCounters.set(
            errorType,
            (this.errorCounters.get(errorType) || 0) + 1
        );

        // 记录到监控服务
        await monitoringService.recordError(error);

        // 记录详细日志
        logger.error('系统错误', {
            type: errorType,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 处理Bot相关错误
     * @param {BotError} error - Bot错误对象
     * @param {Object} ctx - Telegraf上下文
     */
    async handleBotError(error, ctx) {
        logger.error('Bot操作错误', {
            message: error.message,
            originalError: error.originalError,
            context: ctx ? {
                chatId: ctx.chat?.id,
                messageId: ctx.message?.message_id
            } : null
        });

        if (ctx) {
            try {
                const errorMessage = process.env.NODE_ENV === 'production'
                    ? '抱歉，机器人操作出现错误，请稍后重试。'
                    : `错误信息: ${error.message}`;

                await ctx.reply(errorMessage, {
                    reply_to_message_id: ctx.message?.message_id
                });
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    /**
     * 处理数据库相关错误
     * @param {DatabaseError} error - 数据库错误对象
     * @param {Object} ctx - Telegraf上下文
     */
    async handleDatabaseError(error, ctx) {
        logger.error('数据库操作错误', {
            message: error.message,
            originalError: error.originalError,
            operation: error.operation,
            collection: error.collection
        });

        if (ctx) {
            try {
                await ctx.reply('系统暂时无法访问数据，请稍后重试。', {
                    reply_to_message_id: ctx.message?.message_id
                });
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    /**
     * 处理数据验证错误
     * @param {ValidationError} error - 验证错误对象
     * @param {Object} ctx - Telegraf上下文
     */
    async handleValidationError(error, ctx) {
        logger.warn('数据验证错误', {
            message: error.message,
            field: error.field,
            value: error.value
        });

        if (ctx) {
            try {
                const errorMessage = error.field
                    ? `输入数据有误: ${error.field} ${error.message}`
                    : `输入数据有误: ${error.message}`;

                await ctx.reply(errorMessage, {
                    reply_to_message_id: ctx.message?.message_id
                });
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    /**
     * 处理通用错误
     * @param {Error} error - 错误对象
     * @param {Object} ctx - Telegraf上下文
     */
    async handleGenericError(error, ctx) {
        logger.error('未分类的系统错误', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });

        if (ctx) {
            try {
                const errorMessage = process.env.NODE_ENV === 'production'
                    ? '系统遇到意外错误，请稍后重试。'
                    : `系统错误: ${error.message}`;

                await ctx.reply(errorMessage, {
                    reply_to_message_id: ctx.message?.message_id
                });
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    /**
     * 判断是否应该重试操作
     * @param {Error} error - 错误对象
     * @returns {boolean}
     */
    shouldRetry(error) {
        // 网络错误或数据库连接错误可以重试
        const retryableErrors = ['NetworkError', 'ConnectionError', 'TimeoutError'];
        return retryableErrors.includes(error.constructor.name);
    }

    /**
     * 实现重试机制
     * @param {Function} operation - 需要重试的操作
     * @returns {Promise}
     */
    async retryOperation(operation) {
        let retries = 0;

        while (retries < this.retryConfig.maxRetries) {
            try {
                return await Promise.race([
                    operation(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('操作超时')),
                            this.retryConfig.timeout)
                    )
                ]);
            } catch (error) {
                retries++;
                if (retries === this.retryConfig.maxRetries) {
                    throw error;
                }
                await new Promise(resolve =>
                    setTimeout(resolve, this.retryConfig.retryDelay * retries)
                );
            }
        }
    }

    /**
     * 重置错误计数器
     */
    resetErrorCounters() {
        this.errorCounters.clear();
        this.lastReset = Date.now();
    }

    /**
     * 获取错误统计信息
     * @returns {Object} 错误统计数据
     */
    getErrorStats() {
        return {
            counters: Object.fromEntries(this.errorCounters),
            lastReset: this.lastReset,
            totalErrors: Array.from(this.errorCounters.values())
                .reduce((sum, count) => sum + count, 0)
        };
    }
}

// 创建并导出单例实例
const errorHandler = new ErrorHandler();
export { errorHandler };