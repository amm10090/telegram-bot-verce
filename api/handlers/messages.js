// handlers/messages.js
import { logger } from '../services/logger';
import { statisticsService } from '../services/statistics';
import { monitoringService } from '../services/monitoring';
import { commandHandler } from './commands';
import { MessageType, DataModels } from '../types.js';

class MessageHandler {
    constructor() {
        // 初始化消息处理映射
        this.messageTypeHandlers = new Map([
            [MessageType.TEXT, this.handleTextMessage],
            [MessageType.PHOTO, this.handlePhotoMessage],
            [MessageType.VIDEO, this.handleVideoMessage],
            [MessageType.DOCUMENT, this.handleDocumentMessage],
            [MessageType.LOCATION, this.handleLocationMessage],
            [MessageType.CONTACT, this.handleContactMessage]
        ]);
    }

    // 处理更新消息
    async handleUpdate(update, bot) {
        try {
            if (!update.message) {
                return;
            }

            const message = update.message;
            const messageType = this.determineMessageType(message);

            // 记录消息到监控和统计服务
            monitoringService.recordMessage(message.from.id, messageType);
            statisticsService.recordMessage(message, message.from.id, messageType);

            // 如果是命令消息，交给命令处理器处理
            if (messageType === MessageType.COMMAND) {
                await commandHandler.handleCommand(update);
                return;
            }

            // 获取对应的消息处理器
            const handler = this.messageTypeHandlers.get(messageType);
            if (!handler) {
                throw new ValidationError('不支持的消息类型');
            }

            // 处理消息
            await handler.call(this, message, bot);

        } catch (error) {
            logger.error('消息处理错误', {
                updateId: update.update_id,
                error: error.message
            });
            throw error;
        }
    }

    // 判断消息类型
    determineMessageType(message) {
        if (message.text && message.text.startsWith('/')) {
            return MessageType.COMMAND;
        }
        if (message.text) return MessageType.TEXT;
        if (message.photo) return MessageType.PHOTO;
        if (message.video) return MessageType.VIDEO;
        if (message.document) return MessageType.DOCUMENT;
        if (message.location) return MessageType.LOCATION;
        if (message.contact) return MessageType.CONTACT;

        return null;
    }

    // 处理文本消息
    async handleTextMessage(message, bot) {
        try {
            logger.debug('处理文本消息', {
                chatId: message.chat.id,
                text: message.text
            });

            // 这里可以添加更多的文本处理逻辑
            await bot.sendMessage(
                message.chat.id,
                '已收到您的消息：' + message.text
            );
        } catch (error) {
            logger.error('文本消息处理失败', error);
            throw error;
        }
    }

    // 处理图片消息
    async handlePhotoMessage(message, bot) {
        try {
            logger.debug('处理图片消息', {
                chatId: message.chat.id,
                photoId: message.photo[0].file_id
            });

            await bot.sendMessage(
                message.chat.id,
                '已收到您的图片'
            );
        } catch (error) {
            logger.error('图片消息处理失败', error);
            throw error;
        }
    }

    // 处理视频消息
    async handleVideoMessage(message, bot) {
        try {
            logger.debug('处理视频消息', {
                chatId: message.chat.id,
                videoId: message.video.file_id
            });

            await bot.sendMessage(
                message.chat.id,
                '已收到您的视频'
            );
        } catch (error) {
            logger.error('视频消息处理失败', error);
            throw error;
        }
    }

    // 处理文档消息
    async handleDocumentMessage(message, bot) {
        try {
            logger.debug('处理文档消息', {
                chatId: message.chat.id,
                documentId: message.document.file_id
            });

            await bot.sendMessage(
                message.chat.id,
                '已收到您的文档'
            );
        } catch (error) {
            logger.error('文档消息处理失败', error);
            throw error;
        }
    }

    // 处理位置消息
    async handleLocationMessage(message, bot) {
        try {
            logger.debug('处理位置消息', {
                chatId: message.chat.id,
                location: message.location
            });

            await bot.sendMessage(
                message.chat.id,
                '已收到您的位置信息'
            );
        } catch (error) {
            logger.error('位置消息处理失败', error);
            throw error;
        }
    }

    // 处理联系人消息
    async handleContactMessage(message, bot) {
        try {
            logger.debug('处理联系人消息', {
                chatId: message.chat.id,
                contact: message.contact
            });

            await bot.sendMessage(
                message.chat.id,
                '已收到您分享的联系人信息'
            );
        } catch (error) {
            logger.error('联系人消息处理失败', error);
            throw error;
        }
    }

    // 检查消息频率限制
    checkRateLimit(userId) {
        const now = Date.now();
        const userMessages = this.userMessageTimes.get(userId) || [];

        // 清理超过时间窗口的消息记录
        const windowStart = now - SystemConstants.MESSAGE_WINDOW;
        const recentMessages = userMessages.filter(time => time > windowStart);

        // 更新用户消息时间记录
        this.userMessageTimes.set(userId, [...recentMessages, now]);

        // 检查是否超过限制
        return recentMessages.length < SystemConstants.MAX_MESSAGES_PER_WINDOW;
    }

    // 消息预处理
    async preprocessMessage(message) {
        // 移除多余空白字符
        if (message.text) {
            message.text = message.text.trim();
        }

        // 检查消息长度
        if (message.text && message.text.length > SystemConstants.MAX_MESSAGE_LENGTH) {
            throw new ValidationError('消息长度超出限制');
        }

        return message;
    }

    // 获取消息处理统计
    getHandlerStats() {
        const stats = {};
        for (const [type, handler] of this.messageTypeHandlers) {
            stats[type] = {
                registered: true,
                handlerName: handler.name
            };
        }
        return stats;
    }
}

// 导出消息处理器实例
export const messageHandler = new MessageHandler();