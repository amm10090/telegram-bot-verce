// 自定义错误类
export class BotError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'BotError';
        this.originalError = originalError;
    }
}

export class DatabaseError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// 消息类型定义
export const MessageType = {
    TEXT: 'text',
    PHOTO: 'photo',
    VIDEO: 'video',
    DOCUMENT: 'document',
    LOCATION: 'location',
    CONTACT: 'contact',
    COMMAND: 'command'
};

// 用户状态定义
export const UserState = {
    IDLE: 'idle',
    WAITING_FOR_INPUT: 'waiting_for_input',
    IN_CONVERSATION: 'in_conversation',
    BLOCKED: 'blocked'
};

// 系统常量定义
export const SystemConstants = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    DEFAULT_TIMEOUT: 5000,
    MAX_MESSAGE_LENGTH: 4096,
    CACHE_DURATION: 3600000
};

// 数据模型接口
export const DataModels = {
    Message: {
        required: ['messageId', 'chatId', 'timestamp'],
        validate: (data) => {
            if (!data.messageId || !data.chatId || !data.timestamp) {
                throw new ValidationError('必填字段缺失');
            }
        }
    },
    User: {
        required: ['userId', 'username', 'state'],
        validate: (data) => {
            if (!data.userId) {
                throw new ValidationError('用户ID是必需的');
            }
        }
    },
    Stats: {
        required: ['date', 'totalMessages', 'activeUsers'],
        validate: (data) => {
            if (!data.date) {
                throw new ValidationError('统计日期是必需的');
            }
        }
    }
};