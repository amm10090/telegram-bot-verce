import { NextRequest, NextResponse } from 'next/server';
import BotModel from '@/models/bot';
import { connectDB } from '@/lib/db';
import { TelegramClient } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    // 处理Telegram更新
    const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
    const messageText = update.message?.text || update.callback_query?.data;
    
    if (!chatId) {
      console.error('无法获取chat ID');
      return NextResponse.json({ success: true });  // 返回200，避免Telegram重试
    }

    await connectDB();
    
    // 从请求头中获取 bot token
    const authHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (!authHeader) {
      console.error('缺少认证token');
      return NextResponse.json({ success: true });
    }

    // 查找对应的机器人
    const bot = await BotModel.findOne({ token: authHeader });
    if (!bot) {
      console.error('找不到对应的机器人配置');
      return NextResponse.json({ success: true });
    }

    const telegramBot = new TelegramClient(bot.token);

    // 处理命令
    if (update.message?.text?.startsWith('/')) {
      const command = update.message.text.split(' ')[0];
      const menuItem = bot.menus.find(menu => menu.command === command);
      
      if (menuItem?.response) {
        await telegramBot.sendMessage({
          chat_id: chatId,
          text: menuItem.response.content,
          parse_mode: menuItem.response.parseMode,
          reply_markup: menuItem.response.buttons
        });
        return NextResponse.json({ success: true });
      }
    }

    // 处理自动回复
    if (messageText && bot.autoReplies) {
      for (const rule of bot.autoReplies) {
        if (!rule.isEnabled) continue;

        const matches = rule.type === 'keyword'
          ? rule.triggers.some(trigger => messageText.includes(trigger))
          : rule.triggers.some(trigger => new RegExp(trigger).test(messageText));

        if (matches && rule.response) {
          await telegramBot.sendMessage({
            chat_id: chatId,
            text: rule.response.content,
            parse_mode: rule.response.parseMode,
            reply_markup: rule.response.buttons
          });
          return NextResponse.json({ success: true });
        }
      }
    }

    // 处理回调查询
    if (update.callback_query) {
      await telegramBot.post('/answerCallbackQuery', {
        callback_query_id: update.callback_query.id
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('处理Telegram更新失败:', error);
    return NextResponse.json({ success: true });  // 返回200，避免Telegram重试
  }
} 