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
   * 回复回调查询
   */
  async answerCallbackQuery(params: {
    callback_query_id: string;
    text?: string;
    show_alert?: boolean;
    url?: string;
    cache_time?: number;
  }) {
    return this.post('/answerCallbackQuery', params);
  }

  async sendChatAction(params: { chat_id: string; action: 'typing' | 'upload_photo' | 'upload_video' | 'upload_document' }) {
    return this.post('/sendChatAction', params);
  }

  /**
   * 发送 POST 请求到 Telegram API
   */
  private async post(endpoint: string, body: any) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`发送请求到 Telegram API: ${url}`, body);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Telegram API 错误响应:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(data.description || `请求失败: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Telegram API 请求失败:', error);
      throw error;
    }
  }
} 