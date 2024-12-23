// apps/server/src/app/bot/telegram/save-key.ts

import {
    Request,
    Response,
    NextFunction
} from 'express';
import { IncomingHttpHeaders } from 'http';
import mongoose, { Document, Schema } from 'mongoose';
import moment from 'moment-timezone';

// 设置默认时区为中国时区
moment.tz.setDefault('Asia/Shanghai');

/**
 * 扩展请求接口，定义我们需要的请求属性
 */
interface ExtendedRequest extends Request {
    body: {
        name?: string;
        apiKey?: string;
        isEnabled?: boolean;
        [key: string]: any;
    };
    params: {
        id?: string;
        [key: string]: any;
    };
    query: {
        status?: string;
        search?: string;
        [key: string]: any;
    };
    headers: IncomingHttpHeaders & {
        'x-api-key'?: string;
    };
}

/**
 * 扩展响应接口，确保支持链式调用
 */
interface ExtendedResponse extends Response {
    json(body: any): this;
    status(code: number): this;
}

/**
 * Telegram Bot 文档接口
 * 定义存储在 MongoDB 中的 Bot 数据结构
 */
interface TelegramBotDocument extends Document {
    name: string;
    apiKey: string;
    isEnabled: boolean;
    createdAt: Date;
    lastUsed: Date | null;
    status: 'active' | 'inactive';
    formattedCreatedAt: string;  // 虚拟字段
    formattedLastUsed: string;   // 虚拟字段
}

/**
 * 时间处理工具函数：转换时间为中国时区
 */
const toChineseTime = (date: Date | null = new Date()): Date => {
    if (!date) return new Date();
    return moment(date).tz('Asia/Shanghai').toDate();
};

/**
 * 格式化时间为易读的字符串
 */
const formatTime = (date: Date | null): string => {
    if (!date) return '未使用';
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Telegram Bot Schema 定义
 * 使用 mongoose.Schema 来定义数据结构和验证规则
 */
const TelegramBotSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Bot名称是必需的'],
        trim: true,
        minlength: [2, 'Bot名称至少需要2个字符'],
        maxlength: [50, 'Bot名称不能超过50个字符']
    },
    apiKey: {
        type: String,
        required: [true, 'API密钥是必需的'],
        unique: true,
        trim: true,
        validate: {
            validator: function (v: string) {
                return /^\d+:[A-Za-z0-9_-]+$/.test(v);
            },
            message: '无效的API密钥格式'
        }
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: () => toChineseTime(),
        get: (date: Date) => toChineseTime(date)
    },
    lastUsed: {
        type: Date,
        default: null,
        get: (date: Date) => date ? toChineseTime(date) : null
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: {
        currentTime: () => toChineseTime()
    },
    toJSON: { getters: true },
    toObject: { getters: true }
});

// 添加虚拟字段，用于格式化时间显示
TelegramBotSchema.virtual('formattedCreatedAt').get(function (this: TelegramBotDocument) {
    return formatTime(this.createdAt);
});

TelegramBotSchema.virtual('formattedLastUsed').get(function (this: TelegramBotDocument) {
    return formatTime(this.lastUsed);
});

// 创建模型
const TelegramBot = mongoose.model<TelegramBotDocument>('TelegramBot', TelegramBotSchema);

/**
 * 标准化响应格式接口
 */
interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
}

/**
 * 保存新的 API 密钥
 * 处理 POST 请求，创建新的 Bot 记录
 */
export async function saveApiKeyHandler(
    req: ExtendedRequest,
    res: ExtendedResponse
): Promise<void> {
    try {
        const { name, apiKey, isEnabled } = req.body;

        // 验证请求数据
        if (!apiKey || !name) {
            console.log('缺少参数:', {
                hasApiKey: !!apiKey,
                hasName: !!name
            });
            res.status(400).json({
                success: false,
                message: '缺少必要的参数'
            });
            return;
        }

        // 检查是否已存在相同的 API 密钥
        const existingBot = await TelegramBot.findOne({ apiKey });
        if (existingBot) {
            res.status(409).json({
                success: false,
                message: '该 API 密钥已经存在'
            });
            return;
        }

        // 创建新的 Bot 记录
        const newBot = await TelegramBot.create({
            name,
            apiKey,
            isEnabled,
            status: isEnabled ? 'active' : 'inactive',
            createdAt: toChineseTime()
        });

        const response: ApiResponse = {
            success: true,
            data: {
                ...newBot.toObject(),
                formattedCreatedAt: formatTime(newBot.createdAt),
                formattedLastUsed: formatTime(newBot.lastUsed)
            }
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('保存 API 密钥时出错:', error);
        handleError(error, res);
    }
}

/**
 * 获取所有 Bots
 * 处理 GET 请求，返回所有 Bot 记录
 */
export async function getAllBotsHandler(
    req: ExtendedRequest,
    res: ExtendedResponse
): Promise<void> {
    try {
        const { status, search } = req.query;
        const query: Record<string, any> = {};

        // 构建查询条件
        if (status) {
            query.status = status;
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // 查询数据库并格式化时间
        const bots = await TelegramBot.find(query)
            .sort({ createdAt: -1 });

        const response: ApiResponse = {
            success: true,
            data: bots.map(bot => ({
                ...bot.toObject(),
                formattedCreatedAt: formatTime(bot.createdAt),
                formattedLastUsed: formatTime(bot.lastUsed)
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('获取 Bots 列表时出错:', error);
        handleError(error, res);
    }
}

/**
 * 更新 Bot 信息
 * 处理 PUT 请求，更新指定的 Bot 记录
 */
export async function updateBotHandler(
    req: ExtendedRequest,
    res: ExtendedResponse
): Promise<void> {
    try {
        const { id } = req.params;

        // 首先检查 id 是否存在
        if (!id) {
            res.status(400).json({
                success: false,
                message: '缺少 ID 参数'
            });
            return;
        }

        // 验证 ID 格式
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: '无效的 ID 格式'
            });
            return;
        }

        const updateData = req.body;

        // 使用 mongoose.Types.ObjectId 转换 id
        const objectId = new mongoose.Types.ObjectId(id);

        // 更新记录
        const updatedBot = await TelegramBot.findByIdAndUpdate(
            objectId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedBot) {
            res.status(404).json({
                success: false,
                message: '未找到指定的 Bot'
            });
            return;
        }

        const response: ApiResponse = {
            success: true,
            data: updatedBot
        };

        res.json(response);
    } catch (error) {
        console.error('更新 Bot 信息时出错:', error);
        handleError(error, res);
    }
}


/**
 * 删除 Bot
 * 处理 DELETE 请求，删除指定的 Bot 记录
 */
export async function deleteBotHandler(
    req: ExtendedRequest,
    res: ExtendedResponse
): Promise<void> {
    try {
        const { id } = req.params;

        // 首先检查 id 是否存在
        if (!id) {
            res.status(400).json({
                success: false,
                message: '缺少 ID 参数'
            });
            return;
        }

        // 验证 ID 格式
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: '无效的 ID 格式'
            });
            return;
        }

        // 使用 mongoose.Types.ObjectId 转换 id
        const objectId = new mongoose.Types.ObjectId(id);

        // 删除记录
        const deletedBot = await TelegramBot.findByIdAndDelete(objectId);

        if (!deletedBot) {
            res.status(404).json({
                success: false,
                message: '未找到指定的 Bot'
            });
            return;
        }

        const response: ApiResponse = {
            success: true,
            message: '成功删除 Bot'
        };

        res.json(response);
    } catch (error) {
        console.error('删除 Bot 时出错:', error);
        handleError(error, res);
    }
}

/**
 * 统一错误处理函数
 */
function handleError(error: any, res: ExtendedResponse): void {
    if (error.name === 'ValidationError') {
        const response: ApiResponse = {
            success: false,
            message: '验证失败',
            errors: Object.values(error.errors).map((err: any) => err.message)
        };
        res.status(400).json(response);
        return;
    }

    if (error.code === 11000) {
        const response: ApiResponse = {
            success: false,
            message: '该 API 密钥已存在'
        };
        res.status(409).json(response);
        return;
    }

    const response: ApiResponse = {
        success: false,
        message: '服务器内部错误'
    };
    res.status(500).json(response);
}

/**
 * 辅助函数：通过 API 密钥获取 Bot
 */
export async function getBotByApiKey(apiKey: string): Promise<TelegramBotDocument | null> {
    return await TelegramBot.findOne({ apiKey });
}

/**
 * 辅助函数：更新 Bot 的最后使用时间
 */
export async function updateBotLastUsed(apiKey: string): Promise<TelegramBotDocument | null> {
    return await TelegramBot.findOneAndUpdate(
        { apiKey },
        { lastUsed: new Date() },
        { new: true }
    );
}

// 导出类型定义，以供其他模块使用
export type {
    TelegramBotDocument,
    ApiResponse,
    ExtendedRequest,
    ExtendedResponse
};