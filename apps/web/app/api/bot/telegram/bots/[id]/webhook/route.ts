import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId } from 'mongoose';
import { ResponseType } from '@/types/bot';

// 验证 Webhook URL 格式
function isValidWebhookUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 设置 Webhook
 * @description 配置机器人的 Webhook URL，用于接收 Telegram 的实时更新
 * @param bot Bot实例
 * @param customUrl 可选的自定义webhook URL
 * @returns {Promise<{success: boolean; error?: any}>}
 */
async function setWebhook(bot: any, customUrl?: string) {
  try {
    // 根据环境确定基础URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';

    // 使用自定义URL或构建默认URL
    const webhookUrl = customUrl || `${baseUrl}/api/bot/telegram/bots/${bot._id}/webhook`;

    // 设置重试参数
    let success = false;
    let retryCount = 0;
    const maxRetries = 3;
    let lastError;

    while (!success && retryCount < maxRetries) {
      try {
        // 调用Telegram API设置webhook
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${bot.token}/setWebhook`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: webhookUrl,
              allowed_updates: ['message', 'callback_query']
            }),
          }
        );

        if (!telegramResponse.ok) {
          const error = await telegramResponse.json();
          throw new Error(JSON.stringify(error));
        }

        // 更新数据库中的webhook配置
        await BotModel.findByIdAndUpdate(bot._id, {
          $set: {
            'settings.webhookUrl': webhookUrl,
            'settings.allowedUpdates': ['message', 'callback_query']
          }
        });

        success = true;
        break;
      } catch (error) {
        lastError = error;
        retryCount++;
        if (retryCount < maxRetries) {
          // 指数退避重试
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }

    return {
      success,
      error: lastError
    };
  } catch (error) {
    console.error('设置 Webhook 出错:', error);
    return {
      success: false,
      error
    };
  }
}

// 处理 Telegram 消息
async function handleTelegramMessage(bot: any, message: any) {
  try {
    // 检查是否是命令消息
    if (!message.text?.startsWith('/')) {
      return null;
    }

    const command = message.text.split(' ')[0].toLowerCase();
    const menuItem = bot.menus?.find((menu: any) => menu.command.toLowerCase() === command);

    if (!menuItem || !menuItem.response) {
      return null;
    }

    // 准备响应数据
    const response: any = {
      chat_id: message.chat.id,
      text: menuItem.response.content || '',
    };

    // 根据响应类型设置参数
    if (menuItem.response.types.includes(ResponseType.MARKDOWN)) {
      response.parse_mode = 'Markdown';
    } else if (menuItem.response.types.includes(ResponseType.HTML)) {
      response.parse_mode = 'HTML';
    }

    // 处理按钮
    if (menuItem.response.buttons) {
      if (menuItem.response.types.includes(ResponseType.INLINE_BUTTONS)) {
        response.reply_markup = {
          inline_keyboard: menuItem.response.buttons
        };
      } else if (menuItem.response.types.includes(ResponseType.KEYBOARD)) {
        response.reply_markup = {
          keyboard: menuItem.response.buttons,
          resize_keyboard: true
        };
      }
    }

    // 发送响应到 Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${bot.token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      }
    );

    if (!telegramResponse.ok) {
      throw new Error('发送消息到 Telegram 失败');
    }

    return telegramResponse.json();
  } catch (error) {
    console.error('处理 Telegram 消息失败:', error);
    return null;
  }
}

// 设置 Webhook
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // 如果是 Telegram 的更新消息
    if (req.headers.get('content-type') === 'application/json') {
      const update = await req.json();
      
      if (update.message) {
        const bot = await BotModel.findById(params.id);
        if (!bot) {
          return NextResponse.json({ success: false, message: 'Bot不存在' }, { status: 404 });
        }

        // 如果没有设置 webhook，自动设置
        if (!bot.settings?.webhookUrl) {
          const { success, error } = await setWebhook(bot);
          if (!success) {
            console.error('自动设置webhook失败:', error);
          }
        }

        const result = await handleTelegramMessage(bot, update.message);
        return NextResponse.json(result || { success: true });
      }
      
      return NextResponse.json({ success: true });
    }

    // 处理手动设置 Webhook URL 的请求
    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { url } = body;

    if (!url || !isValidWebhookUrl(url)) {
      return NextResponse.json(
        { success: false, message: '无效的Webhook URL' },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id);
    if (!bot) {
      return NextResponse.json(
        { success: false, message: 'Bot不存在' },
        { status: 404 }
      );
    }

    // 设置webhook
    const { success, error } = await setWebhook(bot, url);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          message: '设置Webhook失败',
          error: error instanceof Error ? error.message : '未知错误'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook设置成功',
    });
  } catch (error) {
    console.error('Webhook处理失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Webhook处理失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 删除 Webhook
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的Bot ID',
        },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id);
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bot不存在',
        },
        { status: 404 }
      );
    }

    // 删除 Webhook URL
    bot.settings = {
      ...bot.settings,
      webhookUrl: undefined,
    };
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Webhook删除成功',
    });
  } catch (error) {
    console.error('删除Webhook失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除Webhook失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 获取 Webhook 信息
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的Bot ID',
        },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id).lean();
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bot不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        webhookUrl: bot.settings?.webhookUrl,
      },
      message: '获取Webhook信息成功',
    });
  } catch (error) {
    console.error('获取Webhook信息失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取Webhook信息失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
} 