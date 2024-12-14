// handlers/errors.js
import { logger } from '../services/logger.js';
import { monitoringService } from '../services/monitoring.js';
import { BotError, DatabaseError, ValidationError } from '../api/types.js';

class ErrorHandler {
    constructor() {
        // 初始化错误类型映射
        this.errorTypeHandlers = new Map([
            [BotError, this.handleBotError],
            [DatabaseError, this.handleDatabaseError],
            [ValidationError, this.handleValidationError]
        ]);
    }

    async handle(error, ctx = null) {
        try {
            // 记录错误到监控服务
            monitoringService.recordError(error);

            // 获取对应的错误处理函数
            const handler = this.errorTypeHandlers.get(error.constructor) || this.handleGenericError;

            // 执行错误处理
            await handler.call(this, error, ctx);

        } catch (handlingError) {
            // 如果错误处理过程中出现新错误，记录为严重错误
            logger.error('错误处理过程失败', {
                originalError: error,
                handlingError: handlingError
            });
        }
    }

    // 处理Bot相关错误
    async handleBotError(error, ctx) {
        logger.error('Bot操作错误', {
            message: error.message,
            originalError: error.originalError
        });

        if (ctx) {
            try {
                await ctx.reply('抱歉，机器人操作出现错误，请稍后重试。');
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    // 处理数据库相关错误
    async handleDatabaseError(error, ctx) {
        logger.error('数据库操作错误', {
            message: error.message,
            originalError: error.originalError
        });

        if (ctx) {
            try {
                await ctx.reply('系统暂时无法访问数据，请稍后重试。');
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    // 处理数据验证错误
    async handleValidationError(error, ctx) {
        logger.warn('数据验证错误', {
            message: error.message,
            field: error.field
        });

        if (ctx) {
            try {
                await ctx.reply(`输入数据有误: ${error.message}`);
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    // 处理通用错误
    async handleGenericError(error, ctx) {
        logger.error('未分类的系统错误', {
            message: error.message,
            stack: error.stack
        });

        if (ctx) {
            try {
                await ctx.reply('系统遇到意外错误，请稍后重试。');
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }

    // 处理中间件错误
    async handleMiddlewareError(error, ctx) {
        logger.error('中间件执行错误', {
            message: error.message,
            stack: error.stack
        });

        if (ctx) {
            try {
                await ctx.reply('请求处理过程出错，请重试。');
            } catch (replyError) {
                logger.error('发送错误回复失败', replyError);
            }
        }
    }
}

const errorHandler = new ErrorHandler();
export { errorHandler };