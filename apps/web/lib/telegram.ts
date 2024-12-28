export class TelegramClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async setMyCommands(commands: { command: string; description: string }[]) {
    const response = await fetch(`${this.baseUrl}/setMyCommands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ commands }),
    });

    if (!response.ok) {
      throw new Error('Failed to set bot commands');
    }

    return response.json();
  }
} 