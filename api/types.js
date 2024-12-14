// api/types.js

// 基础错误类，提供通用的错误处理功能
export class BotError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'BotError';
        this.originalError = originalError;
    }
}

// 数据库操作相关错误
export class DatabaseError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

// 数据验证错误，包含具体的字段信息
export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// 消息类型枚举
export const MessageType = {
    TEXT: 'text',           // 文本消息
    PHOTO: 'photo',         // 图片消息
    VIDEO: 'video',         // 视频消息
    DOCUMENT: 'document',   // 文档消息
    LOCATION: 'location',   // 位置信息
    CONTACT: 'contact',     // 联系人信息
    COMMAND: 'command',     // 命令消息
    CALLBACK: 'callback'    // 回调查询
};

// 用户状态枚举
export const UserState = {
    IDLE: 'idle',                    // 空闲状态
    WAITING_FOR_INPUT: 'waiting',    // 等待输入
    IN_CONVERSATION: 'chatting',     // 对话中
    BLOCKED: 'blocked'               // 已封禁
};

// 系统常量定义
export const SystemConstants = {
    MAX_RETRIES: 3,                // 最大重试次数
    RETRY_DELAY: 1000,             // 重试延迟(毫秒)
    DEFAULT_TIMEOUT: 5000,         // 默认超时时间
    MAX_MESSAGE_LENGTH: 4096,      // 最大消息长度
    CACHE_DURATION: 3600000,       // 缓存时间(1小时)
    MESSAGE_WINDOW: 60000,         // 消息时间窗口(1分钟)
    MAX_MESSAGES_PER_WINDOW: 20,   // 每窗口最大消息数
    MAX_FILE_SIZE: 50 * 1024 * 1024 // 最大文件大小(50MB)
};

// 数据模型定义及验证规则
export const DataModels = {
    // 消息数据模型
    Message: {
        required: ['messageId', 'chatId', 'timestamp'],
        validate: (data) => {
            if (!data.messageId || !data.chatId || !data.timestamp) {
                throw new ValidationError('必填字段缺失');
            }
        }
    },

    // 用户数据模型
    User: {
        required: ['userId', 'username', 'state'],
        validate: (data) => {
            if (!data.userId) {
                throw new ValidationError('用户ID是必需的');
            }
            if (data.state && !Object.values(UserState).includes(data.state)) {
                throw new ValidationError('无效的用户状态');
            }
        }
    },

    // 统计数据模型
    Stats: {
        required: ['date', 'totalMessages', 'activeUsers'],
        validate: (data) => {
            if (!data.date) {
                throw new ValidationError('统计日期是必需的');
            }
            if (typeof data.totalMessages !== 'number' || data.totalMessages < 0) {
                throw new ValidationError('消息总数必须是非负数');
            }
            if (typeof data.activeUsers !== 'number' || data.activeUsers < 0) {
                throw new ValidationError('活跃用户数必须是非负数');
            }
        }
    },

    // 设置数据模型
    Settings: {
        required: ['userId', 'language', 'notifications'],
        validate: (data) => {
            if (!data.userId) {
                throw new ValidationError('用户ID是必需的');
            }
            if (data.language && !['zh', 'en'].includes(data.language)) {
                throw new ValidationError('不支持的语言设置');
            }
            if (typeof data.notifications !== 'boolean') {
                throw new ValidationError('通知设置必须是布尔值');
            }
        }
    }
};

// HTTP状态码映射
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};