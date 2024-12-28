import { MenuItem } from '@/types/menu';

export class TelegramMenuService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  // 获取机器人的菜单配置
  async getMenuCommands(botId: string): Promise<MenuItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/telegram/bots/${botId}/commands`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu commands');
      }

      const data = await response.json();
      return data.commands;
    } catch (error) {
      console.error('Error fetching menu commands:', error);
      throw error;
    }
  }

  // 设置机器人的菜单命令
  async setMenuCommands(botId: string, commands: MenuItem[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/telegram/bots/${botId}/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commands }),
      });

      if (!response.ok) {
        throw new Error('Failed to set menu commands');
      }
    } catch (error) {
      console.error('Error setting menu commands:', error);
      throw error;
    }
  }

  // 删除机器人的菜单命令
  async deleteMenuCommand(botId: string, commandId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/telegram/bots/${botId}/commands/${commandId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu command');
      }
    } catch (error) {
      console.error('Error deleting menu command:', error);
      throw error;
    }
  }
} 