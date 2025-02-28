import { MenuItem, CommandResponse, ApiResponse } from '@/types/bot';

export const telegramMenuService = {
  getMenus: async (botId: string): Promise<ApiResponse<MenuItem[]>> => {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu`);
    return response.json();
  },

  updateMenus: async (botId: string, menus: MenuItem[]): Promise<ApiResponse<MenuItem[]>> => {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ menus }),
    });
    return response.json();
  },

  updateMenuOrder: async (botId: string, orders: { id: string; order: number }[]): Promise<ApiResponse<MenuItem[]>> => {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orders }),
    });
    return response.json();
  },

  syncToTelegram: async (botId: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`/api/bot/telegram/bots/${botId}/menu/sync`, {
      method: 'POST',
    });
    return response.json();
  },

  testResponse: async (botId: string, response: CommandResponse): Promise<ApiResponse<any>> => {
    try {
      const res = await fetch(`/api/bot/telegram/bots/${botId}/command/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      });
      return await res.json();
    } catch (error) {
      console.error('测试响应失败:', error);
      throw error;
    }
  }
}; 