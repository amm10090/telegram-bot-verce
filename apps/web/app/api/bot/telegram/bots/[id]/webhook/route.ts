import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId } from 'mongoose';
import { ResponseType } from '@/types/bot';

// 定义常量
const ALLOWED_METHODS = ['POST', 'GET', 'DELETE', 'OPTIONS'];
const TELEGRAM_BASE_URL = 'https://api.telegram.org';
const MAX_RETRIES = 3;
const OPERATION_TIMEOUT = 3000; // 3秒超时
const WEBHOOK_SYNC_INTERVAL = 60000; // 1分钟同步一次

// 定义错误类型
class WebhookError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'WebhookError';
  }
}

// 验证 Webhook URL 格式
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

// 获取基础URL
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
    process.env.WEBHOOK_BASE_URL || 'http://localhost:3000');
}

// 记录错误日志
async function logError(error: any, context: string, botId: string) {
  console.error(`[${new Date().toISOString()}] ${context} for bot ${botId}:`, error);
  // 这里可以添加更多的日志记录逻辑，比如保存到数据库或发送到日志服务
}

// 检查webhook配置一致性
async function checkWebhookConsistency(bot: any) {
  try {
    const telegramWebhook = await fetch(
      `${TELEGRAM_BASE_URL}/bot${bot.token}/getWebhookInfo`
    ).then(res => res.json());

    const dbWebhookUrl = bot.settings?.webhookUrl;
    const telegramWebhookUrl = telegramWebhook.result?.url;

    if (dbWebhookUrl !== telegramWebhookUrl) {
      return {
        isConsistent: false,
        telegram: telegramWebhookUrl,
        database: dbWebhookUrl
      };
    }

    return { isConsistent: true };
  } catch (error) {
    throw new WebhookError(
      '检查webhook一致性失败',
      'CONSISTENCY_CHECK_FAILED',
      error
    );
  }
}

// 自动修复webhook配置
async function autoFixWebhookConfig(bot: any, consistency: any) {
  try {
    if (consistency.telegram && !consistency.database) {
      // Telegram有配置但数据库没有，更新数据库
      await BotModel.findByIdAndUpdate(bot._id, {
        $set: {
          'settings.webhookUrl': consistency.telegram
        }
      });
    } else if (!consistency.telegram && consistency.database) {
      // 数据库有配置但Telegram没有，设置Telegram
      await setWebhook(bot, consistency.database);
    }
    return true;
  } catch (error) {
    throw new WebhookError(
      '自动修复webhook配置失败',
      'AUTO_FIX_FAILED',
      error
    );
  }
}

// 设置 Webhook
async function setWebhook(bot: any, customUrl?: string) {
  const startTime = Date.now();
  let lastError;

  try {
    const webhookUrl = customUrl || `${getBaseUrl()}/api/bot/telegram/bots/${bot._id}/webhook`;
    
    for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
      try {
        const telegramResponse = await Promise.race([
          fetch(`${TELEGRAM_BASE_URL}/bot${bot.token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: webhookUrl,
              allowed_updates: ['message', 'callback_query'],
              drop_pending_updates: true
            }),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('操作超时')), OPERATION_TIMEOUT)
          )
        ]) as Response;

        const responseData = await telegramResponse.json();
        
        if (!telegramResponse.ok) {
          throw new WebhookError(
            responseData.description || '设置webhook失败',
            'TELEGRAM_API_ERROR',
            responseData
          );
        }

        // 更新数据库
        await BotModel.findByIdAndUpdate(bot._id, {
          $set: {
            'settings.webhookUrl': webhookUrl,
            'settings.allowedUpdates': ['message', 'callback_query']
          }
        });

        // 验证设置是否成功
        const consistency = await checkWebhookConsistency(bot);
        if (!consistency.isConsistent) {
          throw new WebhookError(
            'webhook设置验证失败',
            'VERIFICATION_FAILED'
          );
        }

        return { success: true };
      } catch (error) {
        lastError = error;
        if (retryCount < MAX_RETRIES - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
        }
      }
    }

    throw lastError;
  } catch (error) {
    // 如果设置失败，尝试回滚
    try {
      await BotModel.findByIdAndUpdate(bot._id, {
        $set: { 'settings.webhookUrl': bot.settings?.webhookUrl }
      });
    } catch (rollbackError) {
      await logError(rollbackError, 'Rollback failed', bot._id);
    }

    throw error;
  } finally {
    const duration = Date.now() - startTime;
    if (duration > OPERATION_TIMEOUT) {
      console.warn(`Webhook设置操作耗时: ${duration}ms`);
    }
  }
}

// API路由处理函数
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // 尝试使用原始ID或格式化后的ID
    const bot = await BotModel.findOne({
      $or: [
        { _id: id },
        { id: id }
      ]
    }).lean();

    if (!bot) {
      throw new WebhookError('Bot不存在', 'BOT_NOT_FOUND');
    }

    // 检查webhook状态
    const consistency = await checkWebhookConsistency(bot);
    
    // 如果发现不一致，尝试自动修复
    if (!consistency.isConsistent) {
      await autoFixWebhookConfig(bot, consistency);
    }

    // 获取最新状态
    const webhookInfo = await fetch(
      `${TELEGRAM_BASE_URL}/bot${bot.token}/getWebhookInfo`
    ).then(res => res.json());

    return NextResponse.json({
      success: true,
      data: {
        webhookUrl: bot.settings?.webhookUrl,
        telegramWebhookInfo: webhookInfo.result,
        isConsistent: consistency.isConsistent
      }
    });
  } catch (error) {
    await logError(error, 'GET webhook info failed', params.id);
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // 检查是否是来自Telegram的更新消息
    const contentType = req.headers.get('content-type');
    if (contentType === 'application/json') {
      const update = await req.json();
      
      // 如果是命令消息
      if (update.message?.text?.startsWith('/')) {
        // 尝试使用原始ID或格式化后的ID
        const bot = await BotModel.findOne({
          $or: [
            { _id: id },
            { id: id }
          ]
        });

        if (!bot) {
          throw new WebhookError('Bot不存在', 'BOT_NOT_FOUND');
        }

        // 解析命令（移除@机器人名称后缀）
        const command = update.message.text.split('@')[0].toLowerCase();
        
        // 查找对应的菜单配置
        const menuItem = bot.menus?.find((menu: any) => 
          menu.command.toLowerCase() === command
        );

        if (!menuItem || !menuItem.response) {
          // 如果没有找到对应的命令配置，返回成功但不做处理
          return NextResponse.json({ success: true });
        }

        // 准备响应数据
        const response: any = {
          chat_id: update.message.chat.id,
          text: menuItem.response.content || '',
        };

        // 设置解析模式
        if (menuItem.response.types.includes(ResponseType.MARKDOWN)) {
          response.parse_mode = 'Markdown';
        } else if (menuItem.response.types.includes(ResponseType.HTML)) {
          response.parse_mode = 'HTML';
        }

        // 处理媒体类型响应
        if (menuItem.response.types.some((type: ResponseType) => 
          [ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT].includes(type)
        )) {
          if (!menuItem.response.mediaUrl) {
            throw new WebhookError('媒体URL未设置', 'MEDIA_URL_NOT_SET');
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
            throw new WebhookError('不支持的媒体类型', 'UNSUPPORTED_MEDIA_TYPE');
          }

          // 构建媒体消息
          const mediaResponse = {
            chat_id: update.message.chat.id,
            caption: menuItem.response.caption || '',
            parse_mode: response.parse_mode,
          };

          // 添加媒体文件
          const mediaParam = mediaType === ResponseType.PHOTO ? 'photo' : 
                           mediaType === ResponseType.VIDEO ? 'video' : 'document';
          Object.assign(mediaResponse, { [mediaParam]: menuItem.response.mediaUrl });

          // 发送媒体消息
          const telegramResponse = await fetch(
            `${TELEGRAM_BASE_URL}/bot${bot.token}/${method}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mediaResponse),
            }
          );

          if (!telegramResponse.ok) {
            throw new WebhookError(
              '发送媒体消息失败',
              'TELEGRAM_API_ERROR',
              await telegramResponse.json()
            );
          }

          return NextResponse.json({ success: true });
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
              resize_keyboard: menuItem.response.resizeKeyboard ?? true,
              one_time_keyboard: menuItem.response.oneTimeKeyboard ?? false,
              selective: menuItem.response.selective ?? false,
              input_field_placeholder: menuItem.response.inputPlaceholder
            };
          }
        }

        // 发送文本响应
        const telegramResponse = await fetch(
          `${TELEGRAM_BASE_URL}/bot${bot.token}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          }
        );

        if (!telegramResponse.ok) {
          throw new WebhookError(
            '发送消息失败',
            'TELEGRAM_API_ERROR',
            await telegramResponse.json()
          );
        }

        return NextResponse.json({ success: true });
      }

      // 如果不是命令消息，返回成功
      return NextResponse.json({ success: true });
    }

    // 如果是设置webhook的请求，执行原有的webhook设置逻辑
    const body = await req.json();
    const { url } = body;

    if (!url || !isValidWebhookUrl(url)) {
      throw new WebhookError('无效的Webhook URL', 'INVALID_WEBHOOK_URL');
    }

    // 尝试使用原始ID或格式化后的ID
    const bot = await BotModel.findOne({
      $or: [
        { _id: id },
        { id: id }
      ]
    });

    if (!bot) {
      throw new WebhookError('Bot不存在', 'BOT_NOT_FOUND');
    }

    // 保存原始配置用于回滚
    const originalConfig = {
      webhookUrl: bot.settings?.webhookUrl,
      allowedUpdates: bot.settings?.allowedUpdates
    };

    try {
      const result = await setWebhook(bot, url);
      return NextResponse.json({
        success: true,
        message: 'Webhook设置成功'
      });
    } catch (error) {
      // 设置失败时回滚
      await BotModel.findByIdAndUpdate(id, {
        $set: {
          'settings.webhookUrl': originalConfig.webhookUrl,
          'settings.allowedUpdates': originalConfig.allowedUpdates
        }
      });
      throw error;
    }
  } catch (error) {
    await logError(error, 'POST webhook setup failed', params.id);
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // 尝试使用原始ID或格式化后的ID
    const bot = await BotModel.findOne({
      $or: [
        { _id: id },
        { id: id }
      ]
    });

    if (!bot) {
      throw new WebhookError('Bot不存在', 'BOT_NOT_FOUND');
    }

    // 保存原始配置用于回滚
    const originalConfig = {
      webhookUrl: bot.settings?.webhookUrl,
      allowedUpdates: bot.settings?.allowedUpdates
    };

    try {
      // 删除Telegram webhook
      const telegramResponse = await fetch(
        `${TELEGRAM_BASE_URL}/bot${bot.token}/deleteWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!telegramResponse.ok) {
        const error = await telegramResponse.json();
        throw new WebhookError(
          error.description || '删除webhook失败',
          'TELEGRAM_API_ERROR',
          error
        );
      }

      // 清除数据库配置
      await BotModel.findByIdAndUpdate(id, {
        $unset: {
          'settings.webhookUrl': 1,
          'settings.allowedUpdates': 1
        }
      });

      // 验证删除是否成功
      const consistency = await checkWebhookConsistency(bot);
      if (!consistency.isConsistent) {
        throw new WebhookError(
          'webhook删除验证失败',
          'VERIFICATION_FAILED'
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook删除成功'
      });
    } catch (error) {
      // 删除失败时回滚
      await BotModel.findByIdAndUpdate(id, {
        $set: {
          'settings.webhookUrl': originalConfig.webhookUrl,
          'settings.allowedUpdates': originalConfig.allowedUpdates
        }
      });
      throw error;
    }
  } catch (error) {
    await logError(error, 'DELETE webhook failed', params.id);
    return handleApiError(error);
  }
}

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

// 统一的错误处理
function handleApiError(error: any) {
  if (error instanceof WebhookError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: 400 });
  }

  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '服务器内部错误'
    }
  }, { status: 500 });
} 