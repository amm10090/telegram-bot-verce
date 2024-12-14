// handlers/errors.js
import { logger } from '../services/logger.js';
import { monitoringService } from '../services/monitoring.js';
import { BotError, DatabaseError, ValidationError } from '../api/types.js';

class ErrorHandler {
    constructor() {
        this.errorTypeHandlers = new Map([
            [BotError, this.handleBotError],
            [DatabaseError, this.handleDatabaseError],
            [ValidationError, this.handleValidationError]
        ]);
    }

    async handle(error, ctx = null) {
        try {
            monitoringService.recordError(error);

            const handler = this.errorTypeHandlers.get(error.constructor) || this.handleGenericError;
            await handler.call(this, error, ctx);

        } catch (handlingError) {
            logger.error('错误处理过程失败', {
                originalError: error,
                handlingError: handlingError
            });
        }
    }

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