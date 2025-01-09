/**
 * Telegram Bot Webhook 处理路由
 * 
 * 该文件处理来自 Telegram 的 webhook 请求，包括：
 * 1. 消息处理（普通消息和命令）
 * 2. 回调查询处理
 * 3. 自动回复功能
 * 
 * 安全性：
 * - 使用 x-telegram-bot-api-secret-token 头部进行身份验证
 * - secret token 使用 bot ID 作为验证令牌
 */

import { NextRequest, NextResponse } from 'next/server';
import BotModel from '@/models/bot';
import { connectDB } from '@/lib/db';
import { TelegramClient } from '@/lib/telegram';
import { ResponseType } from '@/types/bot';

// 定义重试策略
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1秒

// 处理回调查询的函数
async function handleCallbackQuery(telegramBot: TelegramClient, query: any) {
  try {
    // 立即响应回调查询，避免用户界面卡顿
    await telegramBot.answerCallbackQuery({
      callback_query_id: query.id
    });

    // 如果有回调数据，进行处理
    if (query.data) {
      const chatId = query.message?.chat.id;
      if (chatId) {
        await telegramBot.sendMessage({
          chat_id: chatId,
          text: 'Processing your request...',
          parse_mode: 'HTML'
        });
      }
    }
  } catch (error) {
    console.error('处理回调查询失败:', error);
    throw error;
  }
}

// 处理命令消息的函数
async function handleCommand(telegramBot: TelegramClient, message: any, menuItem: any) {
  if (!menuItem?.response) return;

  const chatId = message.chat.id;
  const response = menuItem.response;

  try {
    // 发送"正在输入"状态
    await telegramBot.sendChatAction({
      chat_id: chatId.toString(),
      action: 'typing'
    });

    // 根据响应类型发送不同的消息
    if (response.types.includes(ResponseType.PHOTO) && response.mediaUrl) {
      await telegramBot.sendChatAction({
        chat_id: chatId.toString(),
        action: 'upload_photo'
      });
      await telegramBot.sendPhoto({
        chat_id: chatId.toString(),
        photo: response.mediaUrl,
        caption: response.caption || '',
        parse_mode: response.parseMode,
        reply_markup: response.buttons
      });
    } else if (response.types.includes(ResponseType.VIDEO) && response.mediaUrl) {
      await telegramBot.sendChatAction({
        chat_id: chatId.toString(),
        action: 'upload_video'
      });
      await telegramBot.sendVideo({
        chat_id: chatId.toString(),
        video: response.mediaUrl,
        caption: response.caption || '',
        parse_mode: response.parseMode,
        reply_markup: response.buttons
      });
    } else if (response.types.includes(ResponseType.DOCUMENT) && response.mediaUrl) {
      await telegramBot.sendChatAction({
        chat_id: chatId.toString(),
        action: 'upload_document'
      });
      await telegramBot.sendDocument({
        chat_id: chatId.toString(),
        document: response.mediaUrl,
        caption: response.caption || '',
        parse_mode: response.parseMode,
        reply_markup: response.buttons
      });
    } else {
      await telegramBot.sendMessage({
        chat_id: chatId.toString(),
        text: response.content,
        parse_mode: response.parseMode,
        reply_markup: response.buttons
      });
    }
  } catch (error) {
    console.error('发送响应失败:', error);
    throw error;
  }
}

// 处理自动回复的函数
async function handleAutoReply(telegramBot: TelegramClient, message: any, rule: any) {
  try {
    const chatId = message.chat.id;
    await telegramBot.sendChatAction({
      chat_id: chatId.toString(),
      action: 'typing'
    });
    
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: rule.response.content,
      parse_mode: rule.response.parseMode,
      reply_markup: rule.response.buttons
    });
  } catch (error) {
    console.error('发送自动回复失败:', error);
    throw error;
  }
}

// 主处理函数
export async function POST(request: NextRequest) {
  let dbConnection = false;
  
  try {
    // 解析请求体
    const update = await request.json();
    
    // 验证必要的信息
    const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
    if (!chatId) {
      return NextResponse.json({ success: true });
    }

    // 验证认证token
    const authHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (!authHeader) {
      return NextResponse.json({ success: true });
    }

    // 连接数据库
    await connectDB();
    dbConnection = true;

    // 查找机器人配置
    const bot = await BotModel.findById(authHeader);
    if (!bot) {
      return NextResponse.json({ success: true });
    }

    // 创建 Telegram 客户端实例
    const telegramBot = new TelegramClient(bot.token);

    // 处理回调查询（优先处理）
    if (update.callback_query) {
      await handleCallbackQuery(telegramBot, update.callback_query);
      return NextResponse.json({ success: true });
    }

    // 处理命令消息
    if (update.message?.text?.startsWith('/')) {
      const command = update.message.text.split(' ')[0]
        .replace(/\/{2,}/g, '/')
        .replace(/_{2,}/g, '_')
        .toLowerCase();

      const menuItem = bot.menus.find((menu) => {
        const normalizedMenuCommand = menu.command
          .replace(/\/{2,}/g, '/')
          .replace(/_{2,}/g, '_')
          .toLowerCase();
        return normalizedMenuCommand === command;
      });

      if (menuItem?.response) {
        await handleCommand(telegramBot, update.message, menuItem);
        return NextResponse.json({ success: true });
      }
    }

    // 处理自动回复
    if (update.message?.text && bot.autoReplies) {
      const messageText = update.message.text;
      
      for (const rule of bot.autoReplies) {
        if (!rule.isEnabled) continue;

        const matches = rule.type === 'keyword'
          ? rule.triggers.some(trigger => messageText.includes(trigger))
          : rule.triggers.some(trigger => {
              try {
                return new RegExp(trigger, 'i').test(messageText);
              } catch (e) {
                console.error('无效的正则表达式:', trigger);
                return false;
              }
            });

        if (matches && rule.response) {
          await handleAutoReply(telegramBot, update.message, rule);
          return NextResponse.json({ success: true });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('处理Telegram更新失败:', error);
    
    // 如果是数据库连接错误，尝试重新连接
    if (!dbConnection) {
      try {
        await connectDB();
      } catch (dbError) {
        console.error('数据库重连失败:', dbError);
      }
    }

    // 返回200，避免Telegram重试
    return NextResponse.json({ success: true });
  }
} 