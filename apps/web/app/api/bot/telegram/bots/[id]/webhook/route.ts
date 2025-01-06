import { NextRequest, NextResponse } from 'next/server';
import BotModel from '@/models/bot';
import { connectDB } from '@/lib/db';
import { TelegramClient } from '@/lib/telegram';

// 处理GET请求 - 获取webhook配置
export async function GET(
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

// 处理POST请求 - 设置webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'Webhook URL不能为空' },
        { status: 400 }
      );
    }

    await connectDB();
    const bot = await BotModel.findById(params.id);
    
    if (!bot) {
      return NextResponse.json(
        { error: '机器人不存在' },
        { status: 404 }
      );
    }

    // 创建Telegram Bot实例
    const telegramBot = new TelegramClient(bot.token);

    // 设置webhook到Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${bot.token}/setWebhook?url=${url}`;
    const setWebhookResult = await fetch(telegramApiUrl);
    const webhookResponse = await setWebhookResult.json();
    
    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: '设置Telegram Webhook失败: ' + webhookResponse.description },
        { status: 500 }
      );
    }

    // 更新数据库中的webhook配置
    const defaultSettings = {
      webhookUrl: url,
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

    // 合并现有设置和默认设置
    bot.settings = {
      ...bot.settings,
      ...defaultSettings,
      webhookUrl: url
    };
    
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Webhook设置成功'
    });
  } catch (error) {
    console.error('设置webhook失败:', error);
    return NextResponse.json(
      { error: '设置webhook失败' },
      { status: 500 }
    );
  }
}

// 处理DELETE请求 - 删除webhook
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

    // 创建Telegram Bot实例
    const telegramBot = new TelegramClient(bot.token);

    // 删除Telegram的webhook设置
    const telegramApiUrl = `https://api.telegram.org/bot${bot.token}/deleteWebhook`;
    const deleteWebhookResult = await fetch(telegramApiUrl);
    const webhookResponse = await deleteWebhookResult.json();
    
    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: '删除Telegram Webhook失败: ' + webhookResponse.description },
        { status: 500 }
      );
    }

    // 更新数据库中的webhook配置
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
