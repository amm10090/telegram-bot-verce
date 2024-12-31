import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { CommandResponse, ResponseType } from '@/types/bot';
import { TelegramClient } from '@/lib/telegram';

/**
 * 测试命令响应的API路由
 * POST /api/bot/telegram/bots/[id]/command/test
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();

    // 查找机器人
    const bot = await BotModel.findById(context.params.id);
    if (!bot) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "机器人不存在",
        }),
        { status: 404 }
      );
    }

    // 获取请求体中的响应配置
    const body = await req.json();
    const { response } = body as { response: CommandResponse };

    // 创建 Telegram 客户端实例
    const telegram = new TelegramClient(bot.token);

    // 根据响应类型发送不同的消息
    let result;
    
    // 处理文本类型响应（包括 Markdown 和 HTML）
    if (response.types.some(t => [ResponseType.TEXT, ResponseType.MARKDOWN, ResponseType.HTML].includes(t))) {
      result = await telegram.sendMessage({
        chat_id: "test",
        text: response.content,
        parse_mode: response.parseMode,
        ...(response.buttons && { reply_markup: response.buttons }),
      });
    }

    // 处理图片类型响应
    if (response.types.includes(ResponseType.PHOTO) && response.mediaUrl) {
      result = await telegram.sendPhoto({
        chat_id: "test",
        photo: response.mediaUrl,
        caption: response.caption,
        parse_mode: response.parseMode,
        ...(response.buttons && { reply_markup: response.buttons }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: "命令测试成功",
      })
    );
  } catch (error) {
    console.error("命令测试失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "命令测试失败",
        error: error instanceof Error ? error.message : "未知错误",
      }),
      { status: 500 }
    );
  }
} 