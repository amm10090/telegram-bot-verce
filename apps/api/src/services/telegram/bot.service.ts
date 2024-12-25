import { Bot, IBot } from '../../models/bot.model';
import { telegramService } from './telegram.service';
import { logger } from '../../utils/logger';
import {
  BotCreateData,
  BotUpdateData,
  BotQueryParams,
  BotValidationResult,
  BotWebhookConfig,
} from '../../types/bot.types';
import { NotFoundError } from '../../utils/error.utils';

export class BotService {
  /**
   * 创建新的Bot
   */
  async createBot(data: BotCreateData): Promise<IBot> {
    try {
      // 验证Token
      const botInfo = await telegramService.validateToken(data.token);

      // 创建Bot记录
      const bot = new Bot({
        name: data.name,
        token: data.token,
        username: botInfo.username,
        description: data.description,
        owner: data.owner,
        settings: {
          allowGroups: true,
          allowChannels: true,
          commandPrefix: '/',
          customCommands: [],
          ...data.settings,
        },
      });

      // 保存Bot记录
      await bot.save();

      // 初始化Bot实例
      await telegramService.initializeBot(data.token);

      return bot;
    } catch (error) {
      logger.error('Bot创建失败:', error);
      throw error;
    }
  }

  /**
   * 更新Bot信息
   */
  async updateBot(id: string, data: BotUpdateData): Promise<IBot> {
    try {
      const bot = await Bot.findById(id);
      if (!bot) {
        throw new NotFoundError('Bot不存在');
      }

      // 更新基本信息
      if (data.name) bot.name = data.name;
      if (data.description !== undefined) bot.description = data.description;
      if (data.isEnabled !== undefined) {
        bot.isEnabled = data.isEnabled;
        if (!data.isEnabled) {
          await telegramService.stopBot(bot.token);
        } else {
          await telegramService.initializeBot(bot.token);
        }
      }

      // 更新设置
      if (data.settings) {
        bot.settings = {
          ...bot.settings,
          ...data.settings,
        };
      }

      await bot.save();
      return bot;
    } catch (error) {
      logger.error('Bot更新失败:', error);
      throw error;
    }
  }

  /**
   * 删除Bot
   */
  async deleteBot(id: string): Promise<void> {
    try {
      const bot = await Bot.findById(id);
      if (!bot) {
        throw new NotFoundError('Bot不存在');
      }

      // 停止Bot实例
      await telegramService.stopBot(bot.token);

      // 删除Bot记录
      await bot.deleteOne();
    } catch (error) {
      logger.error('Bot删除失败:', error);
      throw error;
    }
  }

  /**
   * 获取Bot列表
   */
  async getBots(params: BotQueryParams): Promise<{
    bots: IBot[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        status,
        search,
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params;

      // 构建查询条件
      const query: any = {};
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ];
      }

      // 执行查询
      const total = await Bot.countDocuments(query);
      const bots = await Bot.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return {
        bots,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error('获取Bot列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个Bot
   */
  async getBot(id: string): Promise<IBot> {
    try {
      const bot = await Bot.findById(id);
      if (!bot) {
        throw new NotFoundError('Bot不存在');
      }
      return bot;
    } catch (error) {
      logger.error('获取Bot失败:', error);
      throw error;
    }
  }

  /**
   * 设置Bot的Webhook
   */
  async setWebhook(id: string, config: BotWebhookConfig): Promise<boolean> {
    try {
      const bot = await this.getBot(id);
      const success = await telegramService.setWebhook(bot.token, config);
      if (success) {
        bot.webhookUrl = config.url;
        await bot.save();
      }
      return success;
    } catch (error) {
      logger.error('设置Webhook失败:', error);
      throw error;
    }
  }

  /**
   * 删除Bot的Webhook
   */
  async deleteWebhook(id: string): Promise<boolean> {
    try {
      const bot = await this.getBot(id);
      const success = await telegramService.deleteWebhook(bot.token);
      if (success) {
        bot.webhookUrl = undefined;
        await bot.save();
      }
      return success;
    } catch (error) {
      logger.error('删除Webhook失败:', error);
      throw error;
    }
  }

  /**
   * 验证Bot Token
   */
  async validateToken(token: string): Promise<BotValidationResult> {
    try {
      const botInfo = await telegramService.validateToken(token);
      return {
        isValid: true,
        botInfo,
      };
    } catch (error) {
      logger.error('Token验证失败:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '验证失败',
      };
    }
  }
}

// 导出单例实例
export const botService = new BotService();
