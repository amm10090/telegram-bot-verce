import { Request, Response, NextFunction } from 'express';
import { botService } from '../../services/telegram/bot.service';
import { ResponseUtils } from '../../utils/response.utils';
import { BotQueryParams, BotCreateData, BotUpdateData, BotWebhookConfig, Bot } from '../../types/bot.types';
import { logger } from '../../utils/logger';

export class BotController {
  /**
   * 创建新的Bot
   */
  async createBot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const botData: BotCreateData = req.body;
      const bot = await botService.createBot(botData);
      ResponseUtils.created(res, bot);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新Bot信息
   */
  async updateBot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: BotUpdateData = req.body;
      const bot = await botService.updateBot(id, updateData);
      ResponseUtils.success(res, bot);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除Bot
   */
  async deleteBot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await botService.deleteBot(id);
      ResponseUtils.success(res, null, 'Bot已成功删除');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取Bot列表
   */
  async getBots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: BotQueryParams = {
        status: req.query.status as 'active' | 'inactive',
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        sortBy: req.query.sortBy as keyof Bot | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      const result = await botService.getBots(queryParams);
      ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取单个Bot
   */
  async getBot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bot = await botService.getBot(id);
      ResponseUtils.success(res, bot);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 验证Bot Token
   */
  async validateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const result = await botService.validateToken(token);
      ResponseUtils.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 设置Bot的Webhook
   */
  async setWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const webhookConfig: BotWebhookConfig = req.body;
      const success = await botService.setWebhook(id, webhookConfig);
      ResponseUtils.success(res, { success });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除Bot的Webhook
   */
  async deleteWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const success = await botService.deleteWebhook(id);
      ResponseUtils.success(res, { success });
    } catch (error) {
      next(error);
    }
  }
}

// 导出单例实例
export const botController = new BotController(); 