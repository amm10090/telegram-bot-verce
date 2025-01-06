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

    await connectDB();
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return NextResponse.json({ error: '找不到机器人' }, { status: 404 });
    }

    const telegramBot = new TelegramClient(bot.token);
    
    // 使用 bot token 作为 secret token
    const response = await telegramBot.post('/setWebhook', {
      url,
      secret_token: bot.token,
      allowed_updates: ['message', 'callback_query']
    });

    if (!response.ok) {
      throw new Error('设置webhook失败');
    }

    // 更新数据库中的 webhook URL
    await BotModel.findByIdAndUpdate(params.id, {
      'settings.webhook': url,
      'settings.accessControl': bot.settings?.accessControl || { enabled: false, allowedUsers: [] },
      'settings.autoReply': bot.settings?.autoReply || { enabled: false, rules: [] }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('设置webhook失败:', error);
    return NextResponse.json({ error: '设置webhook失败' }, { status: 500 });
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
