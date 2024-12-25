import TelegramBot from 'node-telegram-bot-api';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { TelegramError } from '../../utils/error.utils';
import { BotInfo, BotWebhookConfig } from '../../types/bot.types';

export class TelegramService {
  private bots: Map<string, TelegramBot>;

  constructor() {
    this.bots = new Map();
  }

  /**
   * 验证Bot Token
   */
  async validateToken(token: string): Promise<BotInfo> {
    try {
      const bot = new TelegramBot(token, { polling: false });
      const me = await bot.getMe();

      return {
        id: me.id.toString(),
        name: me.first_name,
        username: me.username,
        description: undefined // Telegram API 不直接提供描述
      };
    } catch (error) {
      logger.error('Token验证失败:', error);
      throw new TelegramError('无效的Bot Token');
    }
  }

  /**
   * 初始化Bot实例
   */
  async initializeBot(token: string, useWebhook: boolean = false): Promise<TelegramBot> {
    try {
      const options: TelegramBot.ConstructorOptions = {
        polling: !useWebhook
      };

      const bot = new TelegramBot(token, options);
      this.bots.set(token, bot);

      if (!useWebhook) {
        this.setupPolling(bot);
      }

      return bot;
    } catch (error) {
      logger.error('Bot初始化失败:', error);
      throw new TelegramError('Bot初始化失败');
    }
  }

  /**
   * 设置Webhook
   */
  async setWebhook(token: string, config: BotWebhookConfig): Promise<boolean> {
    try {
      const bot = this.getBot(token);
      await bot.setWebHook(config.url, {
        certificate: config.certificate,
        max_connections: config.maxConnections,
        allowed_updates: config.allowedUpdates
      });
      return true;
    } catch (error) {
      logger.error('Webhook设置失败:', error);
      throw new TelegramError('Webhook设置失败');
    }
  }

  /**
   * 删除Webhook
   */
  async deleteWebhook(token: string): Promise<boolean> {
    try {
      const bot = this.getBot(token);
      await bot.deleteWebHook();
      return true;
    } catch (error) {
      logger.error('Webhook删除失败:', error);
      throw new TelegramError('Webhook删除失败');
    }
  }

  /**
   * 获取Bot实例
   */
  getBot(token: string): TelegramBot {
    const bot = this.bots.get(token);
    if (!bot) {
      throw new TelegramError('Bot未初始化');
    }
    return bot;
  }

  /**
   * 停止Bot
   */
  async stopBot(token: string): Promise<void> {
    try {
      const bot = this.bots.get(token);
      if (bot) {
        if (bot.isPolling()) {
          bot.stopPolling();
        }
        this.bots.delete(token);
      }
    } catch (error) {
      logger.error('Bot停止失败:', error);
      throw new TelegramError('Bot停止失败');
    }
  }

  /**
   * 设置轮询
   */
  private setupPolling(bot: TelegramBot): void {
    bot.on('polling_error', (error) => {
      logger.error('轮询错误:', error);
    });

    bot.on('error', (error) => {
      logger.error('Bot错误:', error);
    });
  }

  /**
   * 发送消息
   */
  async sendMessage(token: string, chatId: number | string, text: string, options?: TelegramBot.SendMessageOptions): Promise<TelegramBot.Message> {
    try {
      const bot = this.getBot(token);
      return await bot.sendMessage(chatId, text, options);
    } catch (error) {
      logger.error('消息发送失败:', error);
      throw new TelegramError('消息发送失败');
    }
  }

  /**
   * 获取Bot信息
   */
  async getBotInfo(token: string): Promise<BotInfo> {
    try {
      const bot = this.getBot(token);
      const me = await bot.getMe();
      return {
        id: me.id.toString(),
        name: me.first_name,
        username: me.username,
        description: undefined
      };
    } catch (error) {
      logger.error('获取Bot信息失败:', error);
      throw new TelegramError('获取Bot信息失败');
    }
  }
}

// 导出单例实例
export const telegramService = new TelegramService(); 