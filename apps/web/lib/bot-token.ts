import mongoose from 'mongoose';
import { connectDB } from "@/lib/db";

// 定义Bot模型
const BotSchema = new mongoose.Schema({
  id: String,
  token: String
});

const Bot = mongoose.models.Bot || mongoose.model('Bot', BotSchema);

export async function getBotToken(botId: string): Promise<string | null> {
  try {
    // 获取API基础URL
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/bot/telegram/bots/${botId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取机器人信息失败');
    }
    
    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('无效的机器人数据');
    }

    return data.data.token || null;
  } catch (error) {
    console.error('获取bot token失败:', error);
    return null;
  }
} 