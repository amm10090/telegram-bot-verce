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

// 处理POST请求 - 设置webhook或处理Telegram更新
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentType = request.headers.get('content-type');
    
    // 如果是来自Telegram的更新
    if (contentType === 'application/json' && !params.id) {
      const update = await request.json();
      
      // 处理Telegram更新
      const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
      const messageText = update.message?.text || update.callback_query?.data;
      
      if (!chatId) {
        console.error('无法获取chat ID');
        return NextResponse.json({ error: '无法获取chat ID' }, { status: 400 });
      }

      const bot = await BotModel.findOne({
        'settings.webhookUrl': { $exists: true, $ne: '' }
      });

      if (!bot) {
        console.error('找不到对应的机器人配置');
        return NextResponse.json({ error: '找不到对应的机器人配置' }, { status: 404 });
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
    }
    
    // 否则是设置webhook的请求
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
    const setWebhookResult = await telegramBot.post('/setWebhook', { url });
    
    if (!setWebhookResult.ok) {
      return NextResponse.json(
        { error: '设置Telegram Webhook失败' },
        { status: 500 }
      );
    }

    // 更新数据库中的webhook配置
    bot.settings = {
      ...bot.settings,
      webhookUrl: url
    };
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Webhook设置成功'
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    return NextResponse.json(
      { error: '处理请求失败' },
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
    const deleteWebhookResult = await telegramBot.post('/deleteWebhook', {});
    
    if (!deleteWebhookResult.ok) {
      return NextResponse.json(
        { error: '删除Telegram Webhook失败' },
        { status: 500 }
      );
    }

    // 更新数据库中的webhook配置
    bot.settings = {
      ...bot.settings,
      webhookUrl: ''
    };
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
