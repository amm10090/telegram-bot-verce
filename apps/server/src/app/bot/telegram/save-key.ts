// apps/server/src/app/bot/telegram/save-key.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import moment from 'moment-timezone';

// 设置默认时区为中国时区
moment.tz.setDefault('Asia/Shanghai');

/**
 * 时间处理工具函数
 * 用于转换时间为中国时区
 */
const toChineseTime = (date: Date | null = new Date()): Date => {
    if (!date) return new Date();
    // 转换为东八区时间
    return moment(date).tz('Asia/Shanghai').toDate();
};

// 格式化时间为易读的字符串
const formatTime = (date: Date | null): string => {
    if (!date) return '未使用';
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Telegram Bot 的数据模型定义
 * 使用 mongoose.Schema 来定义数据结构和验证规则
 */
const TelegramBotSchema = new mongoose.Schema({
    // Bot 的名称
    name: {
        type: String,
        required: [true, 'Bot名称是必需的'],
        trim: true,
        minlength: [2, 'Bot名称至少需要2个字符'],
        maxlength: [50, 'Bot名称不能超过50个字符']
    },
    // API 密钥
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
    // Bot 状态
    isEnabled: {
        type: Boolean,
        default: true
    },
    // 创建时间，使用 getter/setter 自动处理时区
    createdAt: {
        type: Date,
        default: () => toChineseTime(),
        get: (date: Date) => toChineseTime(date)
    },
    // 最后使用时间，使用 getter/setter 自动处理时区
    lastUsed: {
        type: Date,
        default: null,
        get: (date: Date) => date ? toChineseTime(date) : null
    },
    // Bot 状态
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    // 添加时间戳字段，并启用 getters
    timestamps: {
        currentTime: () => toChineseTime()
    },
    toJSON: { getters: true },
    toObject: { getters: true }
});

// 添加虚拟字段，用于格式化时间显示
TelegramBotSchema.virtual('formattedCreatedAt').get(function () {
    return formatTime(this.createdAt);
});

TelegramBotSchema.virtual('formattedLastUsed').get(function () {
    return formatTime(this.lastUsed);
});

// 创建模型
const TelegramBot = mongoose.model('TelegramBot', TelegramBotSchema);

/**
 * 保存新的 API 密钥
 * 处理 POST 请求，创建新的 Bot 记录
 */
export async function saveApiKeyHandler(req: Request, res: Response) {
    try {
        // 使用与前端一致的参数名称
        const { name, apiKey, isEnabled } = req.body;

        // 验证请求数据
        if (!apiKey || !name) {
            console.log('缺少参数:', {
                hasApiKey: !!apiKey,
                hasName: !!name
            });
            return res.status(400).json({
                success: false,
                message: '缺少必要的参数'
            });
        }

        // 检查是否已存在相同的 API 密钥
        const existingBot = await TelegramBot.findOne({ apiKey });
        if (existingBot) {
            return res.status(409).json({
                success: false,
                message: '该 API 密钥已经存在'
            });
        }

        // 创建新的 Bot 记录
        const newBot = await TelegramBot.create({
            name,
            apiKey,
            isEnabled,
            status: isEnabled ? 'active' : 'inactive',
            createdAt: toChineseTime()
        });

        // 返回成功响应
        res.status(201).json({
            success: true,
            data: {
                ...newBot.toObject(),
                formattedCreatedAt: formatTime(newBot.createdAt),
                formattedLastUsed: formatTime(newBot.lastUsed)
            }
        });

    } catch (error) {
        console.error('保存 API 密钥时出错:', error);
        handleError(error, res);
    }
}

/**
 * 获取所有 Bots
 * 处理 GET 请求，返回所有 Bot 记录，包含格式化的时间信息
 */
export async function getAllBotsHandler(req: Request, res: Response) {
    try {
        const { status, search } = req.query;
        let query: any = {};

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

        // 转换结果，添加格式化的时间信息
        const formattedBots = bots.map(bot => ({
            ...bot.toObject(),
            formattedCreatedAt: formatTime(bot.createdAt),
            formattedLastUsed: formatTime(bot.lastUsed)
        }));

        res.json({
            success: true,
            data: formattedBots
        });

    } catch (error) {
        console.error('获取 Bots 列表时出错:', error);
        handleError(error, res);
    }
}

/**
 * 更新 Bot 信息
 * 处理 PUT 请求，更新指定的 Bot 记录
 */
export async function updateBotHandler(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 验证 ID 格式
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: '无效的 ID 格式'
            });
        }

        // 更新记录
        const updatedBot = await TelegramBot.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedBot) {
            return res.status(404).json({
                success: false,
                message: '未找到指定的 Bot'
            });
        }

        res.json({
            success: true,
            data: updatedBot
        });

    } catch (error) {
        console.error('更新 Bot 信息时出错:', error);
        handleError(error, res);
    }
}

/**
 * 删除 Bot
 * 处理 DELETE 请求，删除指定的 Bot 记录
 */
export async function deleteBotHandler(req: Request, res: Response) {
    try {
        const { id } = req.params;

        // 验证 ID 格式
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: '无效的 ID 格式'
            });
        }

        // 删除记录
        const deletedBot = await TelegramBot.findByIdAndDelete(id);

        if (!deletedBot) {
            return res.status(404).json({
                success: false,
                message: '未找到指定的 Bot'
            });
        }

        res.json({
            success: true,
            message: '成功删除 Bot'
        });

    } catch (error) {
        console.error('删除 Bot 时出错:', error);
        handleError(error, res);
    }
}

/**
 * 统一错误处理函数
 */
function handleError(error: any, res: Response) {
    // 处理 Mongoose 验证错误
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: '验证失败',
            errors: Object.values(error.errors).map((err: any) => err.message)
        });
    }

    // 处理重复键错误
    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: '该 API 密钥已存在'
        });
    }

    // 其他错误
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
}

// 导出其他可能需要的辅助函数
export async function getBotByApiKey(apiKey: string) {
    return await TelegramBot.findOne({ apiKey });
}

export async function updateBotLastUsed(apiKey: string) {
    return await TelegramBot.findOneAndUpdate(
        { apiKey },
        { lastUsed: new Date() },
        { new: true }
    );
}