/**
 * Telegram Bot Webhook 配置管理路由
 * 
 * 该文件提供了 Telegram Bot Webhook 的配置管理 API，包括：
 * 1. 获取当前 webhook 配置
 * 2. 设置新的 webhook
 * 3. 删除现有 webhook
 * 
 * 安全性：
 * - 使用 bot ID 作为路由参数进行身份识别
 * - 使用 bot ID 作为 secret token 确保 webhook 安全
 */

import { NextRequest, NextResponse } from 'next/server';
import BotModel from '@/models/bot';
import { connectDB } from '@/lib/db';
import { TelegramClient } from '@/lib/telegram';

/**
 * 获取 webhook 配置
 * 
 * @param request - Next.js 请求对象
 * @param params - 路由参数，包含 bot ID
 * @returns 当前 webhook URL 配置
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    // 根据 ID 查找机器人配置
    const bot = await BotModel.findById(params.id);
    
    if (!bot) {
      return NextResponse.json(
        { error: '机器人不存在' },
        { status: 404 }
      );
    }

    // 返回当前 webhook URL
    return NextResponse.json({
      url: bot.settings?.webhookUrl || ''
    });
  } catch (error) {
    console.error('获取webhook配置失败:', error);
    return NextResponse.json(
      { error: '获取webhook配置失败' },
      { status: 500 }
    );
  }
}

/**
 * 设置 webhook 配置
 * 
 * @param request - Next.js 请求对象，包含新的 webhook URL
 * @param params - 路由参数，包含 bot ID
 * @returns 设置结果
 * 
 * 注意：
 * 1. webhook URL 必须是 HTTPS
 * 2. 使用 bot ID 作为 secret token 以确保安全性
 * 3. 同时更新 Telegram 平台和本地数据库的配置
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 从请求体中获取新的 webhook URL
    const { url } = await request.json();

    await connectDB();
    // 查找对应的机器人配置
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return NextResponse.json({ error: '找不到机器人' }, { status: 404 });
    }

    // 创建 Telegram 客户端实例
    const telegramBot = new TelegramClient(bot.token);
    
    // 生成一个安全的 secret token（使用 bot ID）
    const secretToken = bot.id.toString();
    
    // 调用 Telegram API 设置 webhook
    const response = await telegramBot.post('/setWebhook', {
      url,
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query']  // 只接收消息和回调查询更新
    });

    if (!response.ok) {
      throw new Error('设置webhook失败');
    }

    // 更新数据库中的配置
    await BotModel.findByIdAndUpdate(params.id, {
      'settings.webhook': url,
      // 如果没有现有配置，设置默认值
      'settings.accessControl': bot.settings?.accessControl || { enabled: false, allowedUsers: [] },
      'settings.autoReply': bot.settings?.autoReply || { enabled: false, rules: [] }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('设置webhook失败:', error);
    return NextResponse.json({ error: '设置webhook失败' }, { status: 500 });
  }
}

/**
 * 删除 webhook 配置
 * 
 * @param request - Next.js 请求对象
 * @param params - 路由参数，包含 bot ID
 * @returns 删除结果
 * 
 * 注意：
 * 1. 同时删除 Telegram 平台和本地数据库的配置
 * 2. 如果没有现有配置，会初始化默认设置
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const bot = await BotModel.findById(params.id);
    
    if (!bot) {
      return NextResponse.json(
        { error: '机器人不存在' },
        { status: 404 }
      );
    }

    // 创建 Telegram Bot 实例
    const telegramBot = new TelegramClient(bot.token);

    // 调用 Telegram API 删除 webhook 设置
    const telegramApiUrl = `https://api.telegram.org/bot${bot.token}/deleteWebhook`;
    const deleteWebhookResult = await fetch(telegramApiUrl);
    const webhookResponse = await deleteWebhookResult.json();
    
    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: '删除Telegram Webhook失败: ' + webhookResponse.description },
        { status: 500 }
      );
    }

    // 更新数据库中的配置
    // 如果没有现有配置，初始化默认设置
    if (!bot.settings) {
      bot.settings = {
        webhookUrl: '',
        accessControl: {
          enabled: false,
          defaultPolicy: 'allow' as const,
          whitelistOnly: false
        },
        autoReply: {
          enabled: true,
          maxRulesPerBot: 50
        }
      };
    } else {
      bot.settings.webhookUrl = '';
    }
    
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Webhook删除成功'
    });
  } catch (error) {
    console.error('删除webhook失败:', error);
    return NextResponse.json(
      { error: '删除webhook失败' },
      { status: 500 }
    );
  }
}
