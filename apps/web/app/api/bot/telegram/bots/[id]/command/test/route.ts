import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { CommandResponse, ResponseType } from '@/types/bot';

/**
 * 测试命令响应的API路由
 * POST /api/bot/telegram/bots/[id]/command/test
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // 获取请求数据
    const body = await req.json();
    const { response } = body as { response: CommandResponse };

    // 获取机器人信息
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '机器人不存在',
        }),
        { status: 404 }
      );
    }

    // 准备响应数据
    let method = 'sendMessage';
    let params: any = {
      chat_id: bot.userId, // 发送给机器人所有者
      text: response.content,
    };

    // 根据响应类型设置参数
    switch (response.type) {
      case ResponseType.MARKDOWN:
        params.parse_mode = 'Markdown';
        break;
      case ResponseType.HTML:
        params.parse_mode = 'HTML';
        break;
      case ResponseType.PHOTO:
        method = 'sendPhoto';
        params = {
          chat_id: bot.userId,
          photo: response.mediaUrl,
          caption: response.caption,
        };
        break;
      case ResponseType.VIDEO:
        method = 'sendVideo';
        params = {
          chat_id: bot.userId,
          video: response.mediaUrl,
          caption: response.caption,
        };
        break;
      case ResponseType.DOCUMENT:
        method = 'sendDocument';
        params = {
          chat_id: bot.userId,
          document: response.mediaUrl,
          caption: response.caption,
        };
        break;
    }

    // 添加按钮（如果有）
    if (response.buttons) {
      params.reply_markup = {
        inline_keyboard: response.buttons.buttons.map(row =>
          row.map(button => ({
            text: button.text,
            ...(button.type === 'url'
              ? { url: button.value }
              : { callback_data: button.value }
            ),
          }))
        ),
      };
    }

    // 发送测试响应到Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${bot.token}/${method}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    const result = await telegramResponse.json();

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '发送测试响应失败',
          error: result.description,
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '测试响应已发送',
        data: result.result,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('发送测试响应失败:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '发送测试响应失败',
        error: error instanceof Error ? error.message : '未知错误',
      }),
      { status: 500 }
    );
  }
} 