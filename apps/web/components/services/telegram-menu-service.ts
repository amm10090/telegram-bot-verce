import { BotMenu } from '@/types/bot';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const telegramMenuService = {
  // 获取菜单列表
  async getMenus(botId: string): Promise<ApiResponse<BotMenu[]>> {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu`);
    return response.json();
  },

  // 更新菜单列表
  async updateMenus(botId: string, menus: BotMenu[]): Promise<ApiResponse<BotMenu[]>> {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ menus }),
    });
    return response.json();
  },

  // 更新菜单排序
  async updateMenuOrder(botId: string, orders: { id: string; order: number }[]): Promise<ApiResponse<BotMenu[]>> {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orders }),
    });
    return response.json();
  },

  // 同步菜单到Telegram
  async syncToTelegram(botId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu/sync`, {
      method: 'POST',
    });
    return response.json();
  },
}; 