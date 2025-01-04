// apps/web/src/services/telegram-bot-service.ts

import { ApiResponse, BotResponse, BotCreateInput, BotUpdateInput, BotQueryParams, PaginatedApiResponse } from '@/types/bot';

// API 配置常量
const API_CONFIG = {
  BASE_URL: '/api/bot/telegram',
  TIMEOUT: 10000,
  RETRY_COUNT: 2,
  RETRY_BASE_DELAY: 1000,
} as const;

/**
 * Telegram Bot 服务类
 * 处理所有与 Telegram Bot 相关的 API 请求
 */
export class TelegramBotService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * 验证 Bot Token
   */
  async validateToken(token: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      return await response.json();
    } catch (error) {
      throw this.handleError(error, '验证 Token 失败');
    }
  }

  /**
   * 获取 Bot 列表
   */
  async getAllBots(params?: BotQueryParams, signal?: AbortSignal): Promise<ApiResponse<BotResponse[]>> {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      // 添加缓存控制和错误重试
      const response = await fetch(`${this.baseUrl}/bots?${queryParams.toString()}`, {
        signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 } // 禁用 Next.js 的自动缓存
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 如果请求成功但没有数据，返回空数组
      if (data.success) {
        return {
          success: true,
          data: data.data || [],
          message: data.data?.length ? '获取Bot列表成功' : '暂无Bot',
          pagination: data.pagination
        };
      }

      // 如果是服务器错误，返回错误信息
      return {
        success: false,
        data: [],
        message: data.message || '获取Bot列表失败',
        error: data.error
      };
    } catch (error) {
      // 如果是取消请求的错误，直接抛出
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      console.error('获取Bot列表失败:', error);
      return {
        success: false,
        data: [],
        message: '获取Bot列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取单个 Bot
   */
  async getBot(id: string): Promise<ApiResponse<BotResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${id}`);
      return await response.json();
    } catch (error) {
      throw this.handleError(error, '获取 Bot 详情失败');
    }
  }

  /**
   * 创建新的 Bot
   */
  async createBot(data: BotCreateInput): Promise<ApiResponse<BotResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      throw this.handleError(error, '创建 Bot 失败');
    }
  }

  /**
   * 更新 Bot
   */
  async updateBot(id: string, data: BotUpdateInput): Promise<ApiResponse<BotResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      throw this.handleError(error, '更新 Bot 失败');
    }
  }

  /**
   * 删除 Bot
   */
  async deleteBot(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${id}`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      throw this.handleError(error, '删除 Bot 失败');
    }
  }

  /**
   * 批量删除 Bot
   */
  async deleteBots(ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      return await response.json();
    } catch (error) {
      throw this.handleError(error, '批量删除 Bot 失败');
    }
  }

  /**
   * 更新 Bot 状态
   */
  async updateBotStatus(id: string, status: 'active' | 'disabled'): Promise<ApiResponse<BotResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      return await response.json();
    } catch (error) {
      throw this.handleError(error, '更新 Bot 状态失败');
    }
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<ApiResponse<{
    version: string;
    stats: {
      total: number;
      active: number;
      inactive: number;
    };
    status: string;
  }>> {
    try {
      const response = await fetch(this.baseUrl);
      return await response.json();
    } catch (error) {
      throw this.handleError(error, '获取系统状态失败');
    }
  }

  /**
   * 搜索 Bot
   */
  async searchBots(query: string, type: 'name' | 'token' | 'all' = 'name'): Promise<ApiResponse<BotResponse[]>> {
    try {
      const params = new URLSearchParams({
        q: query,
        type: type
      });
      const response = await fetch(`${this.baseUrl}/bots/search?${params.toString()}`);
      return await response.json();
    } catch (error) {
      throw this.handleError(error, '搜索Bot失败');
    }
  }

  /**
   * 设置 Webhook
   */
  async setWebhook(botId: string, url: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${botId}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      return await response.json();
    } catch (error) {
      throw this.handleError(error, '设置Webhook失败');
    }
  }

  /**
   * 获取 Webhook 信息
   */
  async getWebhook(botId: string): Promise<ApiResponse<{ webhookUrl?: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${botId}/webhook`);
      return await response.json();
    } catch (error) {
      throw this.handleError(error, '获取Webhook信息失败');
    }
  }

  /**
   * 删除 Webhook
   */
  async deleteWebhook(botId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/bots/${botId}/webhook`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      throw this.handleError(error, '删除Webhook失败');
    }
  }

  /**
   * 统一错误处理
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    console.error(`API Error: ${defaultMessage}`, error);
    
    if (error instanceof Error) {
      return new Error(`${defaultMessage}: ${error.message}`);
    }
    
    return new Error(defaultMessage);
  }
}

// 导出单例实例
export const telegramBotService = new TelegramBotService();