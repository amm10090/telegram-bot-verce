// apps/server/src/app/bot/telegram/save-key.ts

import mongoose, { Schema, Types } from 'mongoose';  // 添加 Types 的显式导入
import moment from 'moment-timezone';
import {
    ExtendedRequest,
    ExtendedResponse,
    TelegramBotDocument,
    ApiResponse,
    HttpStatus,
    ApiErrorType,
    BotStatus
} from './types';

/**
 * 定义时区常量
 * 使用中国时区确保时间处理的一致性
 */
const TIME_ZONE = 'Asia/Shanghai';
moment.tz.setDefault(TIME_ZONE);

/**
 * 时间工具类
 * 封装所有与时间相关的处理逻辑，确保整个应用的时间处理一致性
 */
class TimeUtil {
    /**
     * 转换时间为中国时区
     * 处理null和undefined情况，确保始终返回有效的Date对象
     */
    static toChineseTime(date?: Date | null): Date {
        if (!date) return new Date();
        return moment(date).tz(TIME_ZONE).toDate();
    }

    /**
     * 格式化时间显示
     * 提供用户友好的时间字符串格式
     */
    static formatTime(date?: Date | null): string {
        if (!date) return '未使用';
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    }
}

/**
 * Telegram Bot Schema定义
 * 使用TypeScript类型来增强mongoose schema的类型安全性
 */
const TelegramBotSchema = new Schema<TelegramBotDocument>({
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
            validator: (v: string) => /^\d+:[A-Za-z0-9_-]+$/.test(v),
            message: '无效的API密钥格式'
        }
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: () => TimeUtil.toChineseTime(),
        get: (date: Date) => TimeUtil.toChineseTime(date)
    },
    lastUsed: {
        type: Date,
        default: null,
        get: (date: Date | null) => date ? TimeUtil.toChineseTime(date) : null
    },
    status: {
        type: String,
        enum: {
            values: Object.values(BotStatus),
            message: '无效的Bot状态'
        },
        default: BotStatus.ACTIVE,
        required: true
    }
}, {
    timestamps: {
        currentTime: () => TimeUtil.toChineseTime()
    },
    toJSON: { getters: true },
    toObject: { getters: true }
});

/**
 * 添加虚拟字段用于格式化时间显示
 */
TelegramBotSchema.virtual('formattedCreatedAt').get(function (this: TelegramBotDocument): string {
    return TimeUtil.formatTime(this.createdAt);
});

TelegramBotSchema.virtual('formattedLastUsed').get(function (this: TelegramBotDocument): string {
    return TimeUtil.formatTime(this.lastUsed);
});

// 创建模型
const TelegramBot = mongoose.model<TelegramBotDocument>('TelegramBot', TelegramBotSchema);

/**
 * 错误处理工具类
 * 统一处理各种错误情况，提供标准的错误响应
 */
class ErrorHandler {
    /**
     * 处理验证错误
     */
    static handleValidationError(error: mongoose.Error.ValidationError): ApiResponse {
        return {
            success: false,
            message: '验证失败',
            errors: Object.values(error.errors).map(err => err.message)
        };
    }

    /**
     * 处理重复键错误
     */
    static handleDuplicateKeyError(): ApiResponse {
        return {
            success: false,
            message: '该API密钥已存在'
        };
    }

    /**
     * 处理通用错误
     */
    static handleGenericError(error: Error): ApiResponse {
        console.error('操作失败:', error);
        return {
            success: false,
            message: '服务器内部错误',
            errors: [error.message]
        };
    }

    /**
     * 统一的错误处理入口
     */
    static handle(error: any, res: ExtendedResponse): void {
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(HttpStatus.BAD_REQUEST).json(this.handleValidationError(error));
        } else if (error.code === 11000) {
            res.status(HttpStatus.CONFLICT).json(this.handleDuplicateKeyError());
        } else {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(this.handleGenericError(error));
        }
    }
}

/**
 * Bot服务类
 * 封装所有与Bot相关的数据库操作
 */
class BotService {
    /**
     * 创建新的Bot
     */
    static async createBot(data: {
        name: string;
        apiKey: string;
        isEnabled?: boolean;
    }): Promise<TelegramBotDocument> {
        return await TelegramBot.create({
            ...data,
            status: data.isEnabled !== false ? BotStatus.ACTIVE : BotStatus.INACTIVE,
            createdAt: TimeUtil.toChineseTime()
        });
    }

    /**
     * 查找所有符合条件的Bot
     */
    static async findBots(query: {
        status?: string;
        name?: { $regex: string; $options: string; };
    }): Promise<TelegramBotDocument[]> {
        return await TelegramBot.find(query).sort({ createdAt: -1 });
    }

    /**
     * 验证并查找指定ID的Bot
     */
    static async validateAndFindBot(id: string): Promise<TelegramBotDocument> {
        // 使用 Types.ObjectId.isValid 替代 mongoose.Types.ObjectId.isValid
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('无效的ID格式');
        }

        // Mongoose 会自动将字符串 ID 转换为 ObjectId
        const bot = await TelegramBot.findById(id);
        if (!bot) {
            throw new Error('未找到指定的Bot');
        }

        return bot;
    }

    /**
     * 更新Bot信息
     */
    static async updateBot(id: string, updateData: Partial<TelegramBotDocument>): Promise<TelegramBotDocument | null> {
        await this.validateAndFindBot(id);
        // Mongoose 会自动处理 ID 转换
        return await TelegramBot.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }

    /**
     * 删除Bot
     */
    static async deleteBot(id: string): Promise<TelegramBotDocument | null> {
        await this.validateAndFindBot(id);
        // Mongoose 会自动处理 ID 转换
        return await TelegramBot.findByIdAndDelete(id);
    }

    /**
     * 通过API密钥查找Bot
     */
    static async findBotByApiKey(apiKey: string): Promise<TelegramBotDocument | null> {
        return await TelegramBot.findOne({ apiKey });
    }
}

/**
 * API处理器类
 * 包含所有路由处理器的实现
 */
class BotHandler {
    /**
     * 创建新Bot
     */
    static async saveApiKeyHandler(req: ExtendedRequest, res: ExtendedResponse): Promise<void> {
        try {
            const { name, apiKey, isEnabled } = req.body;

            if (!apiKey || !name) {
                res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: '缺少必要的参数'
                });
                return;
            }

            const newBot = await BotService.createBot({ name, apiKey, isEnabled });

            res.status(HttpStatus.CREATED).json({
                success: true,
                data: newBot
            });
        } catch (error) {
            ErrorHandler.handle(error, res);
        }
    }

    /**
     * 获取所有Bot
     */
    static async getAllBotsHandler(req: ExtendedRequest, res: ExtendedResponse): Promise<void> {
        try {
            const { status, search } = req.query;
            const query: any = {};

            if (status) {
                query.status = status;
            }
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            const bots = await BotService.findBots(query);

            res.json({
                success: true,
                data: bots
            });
        } catch (error) {
            ErrorHandler.handle(error, res);
        }
    }

    /**
     * 更新Bot信息
     */
    static async updateBotHandler(req: ExtendedRequest, res: ExtendedResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: '缺少ID参数'
                });
                return;
            }

            const updatedBot = await BotService.updateBot(id, req.body);
            res.json({
                success: true,
                data: updatedBot
            });
        } catch (error) {
            ErrorHandler.handle(error, res);
        }
    }

    /**
     * 删除Bot
     */
    static async deleteBotHandler(req: ExtendedRequest, res: ExtendedResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: '缺少ID参数'
                });
                return;
            }

            await BotService.deleteBot(id);
            res.json({
                success: true,
                message: '成功删除Bot'
            });
        } catch (error) {
            ErrorHandler.handle(error, res);
        }
    }
}

// 导出API处理器
export const saveApiKeyHandler = BotHandler.saveApiKeyHandler;
export const getAllBotsHandler = BotHandler.getAllBotsHandler;
export const updateBotHandler = BotHandler.updateBotHandler;
export const deleteBotHandler = BotHandler.deleteBotHandler;

// 导出工具方法
export const getBotByApiKey = BotService.findBotByApiKey.bind(BotService);
export const updateBotLastUsed = async (apiKey: string): Promise<TelegramBotDocument | null> => {
    return await TelegramBot.findOneAndUpdate(
        { apiKey },
        { lastUsed: TimeUtil.toChineseTime() },
        { new: true }
    );
};