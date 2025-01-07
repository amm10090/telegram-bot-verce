export class TelegramClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  /**
   * 发送普通消息
   */
  async sendMessage(params: {
    chat_id: string;
    text: string;
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: any;
  }) {
    return this.post('/sendMessage', params);
  }

  /**
   * 发送图片
   */
  async sendPhoto(params: {
    chat_id: string;
    photo: string;
    caption?: string;
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: any;
  }) {
    return this.post('/sendPhoto', params);
  }

  /**
   * 发送视频
   */
  async sendVideo(params: {
    chat_id: string;
    video: string;
    caption?: string;
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: any;
  }) {
    return this.post('/sendVideo', params);
  }

  /**
   * 发送文档
   */
  async sendDocument(params: {
    chat_id: string;
    document: string;
    caption?: string;
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: any;
  }) {
    return this.post('/sendDocument', params);
  }

  /**
   * 设置机器人命令
   */
  async setMyCommands(commands: { command: string; description: string }[]) {
    return this.post('/setMyCommands', { commands });
  }

  /**
   * 获取webhook信息
   */
  async getWebhookInfo() {
    const response = await fetch(`${this.baseUrl}/getWebhookInfo`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || '获取webhook信息失败');
    }
    const data = await response.json();
    return { url: data.result?.url || '' };
  }

  /**
   * 删除webhook配置
   */
  async deleteWebhook() {
    return this.post('/deleteWebhook', {});
  }

  /**
   * 设置webhook配置
   */
  async setWebhook(params: { url: string; secret_token: string }) {
    return this.post('/setWebhook', params);
  }

  /**
   * 发送 POST 请求到 Telegram API
   */
  private async post(endpoint: string, body: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || '请求失败');
    }

    return response.json();
  }
} 