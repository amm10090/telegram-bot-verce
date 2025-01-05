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

// 定义允许的HTTP方法（改为内部常量）
const ALLOWED_METHODS = ['POST', 'GET', 'DELETE'];

// 添加OPTIONS方法处理
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
      process.env.WEBHOOK_BASE_URL || 'http://localhost:3000');

    console.log('环境变量状态:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL,
      NODE_ENV: process.env.NODE_ENV
    });

    // 使用自定义URL或构建默认URL
    const webhookUrl = customUrl || `${baseUrl}/api/bot/telegram/bots/${bot._id}/webhook`;
    console.log('设置webhook URL:', webhookUrl);

    // 获取Telegram API基础URL
    const telegramBaseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8081'
      : 'https://api.telegram.org';
    
    console.log('使用Telegram API基础URL:', telegramBaseUrl);

    // 设置重试参数
    let success = false;
    let retryCount = 0;
    const maxRetries = 3;
    let lastError;

    while (!success && retryCount < maxRetries) {
      try {
        console.log(`尝试设置webhook (第${retryCount + 1}次)`);
        // 调用Telegram API设置webhook
        const telegramResponse = await fetch(
          `${telegramBaseUrl}/bot${bot.token}/setWebhook`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: webhookUrl,
              allowed_updates: ['message', 'callback_query'],
              drop_pending_updates: true
            }),
          }
        );

        const responseData = await telegramResponse.json();
        console.log('Telegram setWebhook响应:', responseData);

        if (!telegramResponse.ok) {
          throw new Error(JSON.stringify(responseData));
        }

        // 获取webhook信息以验证设置
        const webhookInfo = await fetch(
          `${telegramBaseUrl}/bot${bot.token}/getWebhookInfo`
        ).then(res => res.json());
        console.log('Webhook信息验证:', webhookInfo);

        // 更新数据库中的webhook配置
        const updateResult = await BotModel.findByIdAndUpdate(bot._id, {
          $set: {
            'settings.webhookUrl': webhookUrl,
            'settings.allowedUpdates': ['message', 'callback_query']
          }
        });
        console.log('数据库更新结果:', updateResult ? '成功' : '失败');

        success = true;
        break;
      } catch (error) {
        console.error(`第${retryCount + 1}次设置webhook失败:`, error);
        lastError = error;
        retryCount++;
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`等待${waitTime}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
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

    // 解析命令（转换为小写并移除可能的@机器人名称后缀）
    const command = message.text.split('@')[0].toLowerCase();
    console.log('收到命令:', command);

    // 查找对应的菜单配置
    const menuItem = bot.menus?.find((menu: any) => menu.command.toLowerCase() === command);
    if (!menuItem || !menuItem.response) {
      console.log('未找到命令配置:', command);
      return null;
    }

    console.log('找到命令配置:', menuItem);

    // 准备基础响应数据
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

    // 处理媒体类型响应
    if (menuItem.response.types.some((type: ResponseType) => [ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT].includes(type))) {
      if (!menuItem.response.mediaUrl) {
        console.error('媒体类型响应缺少URL');
        return null;
      }

      const mediaType = menuItem.response.types.find((type: ResponseType) => 
        [ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT].includes(type)
      );

      const methodMap = {
        [ResponseType.PHOTO]: 'sendPhoto',
        [ResponseType.VIDEO]: 'sendVideo',
        [ResponseType.DOCUMENT]: 'sendDocument'
      };

      const method = methodMap[mediaType as keyof typeof methodMap];
      if (!method) {
        console.error('不支持的媒体类型:', mediaType);
        return null;
      }

      // 构建媒体消息请求
      const mediaResponse = {
        chat_id: message.chat.id,
        caption: menuItem.response.caption,
        parse_mode: response.parse_mode,
      };

      // 添加媒体文件参数
      const mediaParam = mediaType === ResponseType.PHOTO ? 'photo' : 
                        mediaType === ResponseType.VIDEO ? 'video' : 'document';
      Object.assign(mediaResponse, { [mediaParam]: menuItem.response.mediaUrl });

      // 发送媒体消息
      const telegramResponse = await fetch(
        process.env.NODE_ENV === 'development' 
          ? `http://localhost:8081/bot${bot.token}/${method}`
          : `https://api.telegram.org/bot${bot.token}/${method}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mediaResponse),
        }
      );

      if (!telegramResponse.ok) {
        throw new Error('发送媒体消息失败');
      }

      return telegramResponse.json();
    }

    // 处理按钮
    if (menuItem.response.buttons) {
      if (menuItem.response.types.includes(ResponseType.INLINE_BUTTONS)) {
        response.reply_markup = {
          inline_keyboard: menuItem.response.buttons.buttons
        };
      } else if (menuItem.response.types.includes(ResponseType.KEYBOARD)) {
        response.reply_markup = {
          keyboard: menuItem.response.buttons.buttons,
          resize_keyboard: menuItem.response.resizeKeyboard,
          one_time_keyboard: menuItem.response.oneTimeKeyboard,
          selective: menuItem.response.selective
        };
      }
    }

    // 发送响应到 Telegram
    console.log('发送响应:', response);
    const telegramBaseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8081'
      : 'https://api.telegram.org';

    const telegramResponse = await fetch(
      `${telegramBaseUrl}/bot${bot.token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      }
    );

    if (!telegramResponse.ok) {
      const error = await telegramResponse.json();
      console.error('Telegram响应错误:', error);
      throw new Error('发送消息到 Telegram 失败');
    }

    // 如果配置了webhook，发送通知
    if (bot.settings?.webhookUrl) {
      try {
        // 准备webhook数据
        const webhookData = {
          type: 'command',
          command: command,
          message: {
            chat_id: message.chat.id,
            from: message.from,
            text: message.text,
            date: message.date
          },
          response: {
            type: menuItem.response.types,
            content: menuItem.response.content,
            success: true
          },
          timestamp: new Date().toISOString()
        };

        // 发送webhook通知（使用Promise.race设置超时）
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Webhook请求超时')), 5000)
        );

        const webhookRequest = fetch(bot.settings.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData),
        });

        await Promise.race([webhookRequest, timeout]);
      } catch (error) {
        // webhook失败不影响主流程，只记录错误
        console.error('Webhook通知失败:', error);
      }
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
    // 验证请求方法
    if (req.method !== 'POST') {
      return NextResponse.json(
        { success: false, message: '不支持的请求方法' },
        { status: 405 }
      );
    }

    await connectDB();
    console.log('收到webhook POST请求:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      id: params.id
    });

    // 如果是 Telegram 的更新消息
    if (req.headers.get('content-type') === 'application/json') {
      const update = await req.json();
      console.log('Telegram更新消息:', JSON.stringify(update, null, 2));
      
      if (update.message) {
        console.log('处理Telegram消息:', update.message);
        const bot = await BotModel.findById(params.id);
        if (!bot) {
          console.error('Bot不存在:', params.id);
          return NextResponse.json({ success: false, message: 'Bot不存在' }, { status: 404 });
        }

        // 如果没有设置 webhook，自动设置
        if (!bot.settings?.webhookUrl) {
          console.log('Bot未设置webhook，开始自动设置');
          const { success, error } = await setWebhook(bot);
          if (!success) {
            console.error('自动设置webhook失败:', error);
          } else {
            console.log('自动设置webhook成功');
          }
        }

        const result = await handleTelegramMessage(bot, update.message);
        console.log('消息处理结果:', result);
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

// 获取 Webhook 信息
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证请求方法
    if (req.method !== 'GET') {
      return NextResponse.json(
        { success: false, message: '不支持的请求方法' },
        { status: 405 }
      );
    }

    await connectDB();
    console.log('收到webhook GET请求:', {
      method: req.method,
      id: params.id
    });

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id).lean();
    if (!bot) {
      return NextResponse.json(
        { success: false, message: 'Bot不存在' },
        { status: 404 }
      );
    }

    // 获取webhook信息
    const telegramBaseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8081'
      : 'https://api.telegram.org';

    const webhookInfo = await fetch(
      `${telegramBaseUrl}/bot${bot.token}/getWebhookInfo`
    ).then(res => res.json());

    return NextResponse.json({
      success: true,
      data: {
        webhookUrl: bot.settings?.webhookUrl,
        telegramWebhookInfo: webhookInfo
      },
      message: '获取Webhook信息成功',
    });
  } catch (error) {
    return handleMethodError(error);
  }
}

// 删除 Webhook
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证请求方法
    if (req.method !== 'DELETE') {
      return NextResponse.json(
        { success: false, message: '不支持的请求方法' },
        { status: 405 }
      );
    }

    await connectDB();
    console.log('收到webhook DELETE请求:', {
      method: req.method,
      id: params.id
    });

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
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

    // 删除Telegram webhook设置
    const telegramBaseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8081'
      : 'https://api.telegram.org';

    const telegramResponse = await fetch(
      `${telegramBaseUrl}/bot${bot.token}/deleteWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!telegramResponse.ok) {
      const error = await telegramResponse.json();
      throw new Error(JSON.stringify(error));
    }

    // 删除数据库中的webhook配置
    bot.settings = {
      ...bot.settings,
      webhookUrl: undefined,
      allowedUpdates: undefined
    };
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Webhook删除成功',
    });
  } catch (error) {
    return handleMethodError(error);
  }
}

// 添加错误处理中间件
function handleMethodError(error: any) {
  console.error('请求处理错误:', error);
  return NextResponse.json(
    {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
    },
    { status: 500 }
  );
} 