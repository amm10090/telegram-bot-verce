import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import BotModel from "@/models/bot";
import { CommandResponse, ResponseType } from "@/types/bot";
import { TelegramClient } from "@/lib/telegram";

/**
 * 处理命令测试请求
 * 该路由用于测试机器人命令的响应效果
 * @param req 请求对象
 * @param params 路由参数，包含机器人ID
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 连接数据库
    await connectDB();

    // 查找机器人
    const bot = await BotModel.findById(params.id);
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
    if (response.types.some(type => [ResponseType.TEXT, ResponseType.MARKDOWN, ResponseType.HTML].includes(type))) {
      result = await telegram.sendMessage({
        chat_id: "test",
        text: response.content,
        parse_mode: response.parseMode,
        ...(response.buttons && { reply_markup: response.buttons }),
      });
    }

    // 处理图片类型响应
    if (response.types.includes(ResponseType.PHOTO)) {
      result = await telegram.sendPhoto({
        chat_id: "test",
        photo: response.mediaUrl!,
        caption: response.caption,
        parse_mode: response.parseMode,
        ...(response.buttons && { reply_markup: response.buttons }),
      });
    }

    // 处理视频类型响应
    if (response.types.includes(ResponseType.VIDEO)) {
      result = await telegram.sendVideo({
        chat_id: "test",
        video: response.mediaUrl!,
        caption: response.caption,
        parse_mode: response.parseMode,
        ...(response.buttons && { reply_markup: response.buttons }),
      });
    }

    // 处理文档类型响应
    if (response.types.includes(ResponseType.DOCUMENT)) {
      result = await telegram.sendDocument({
        chat_id: "test",
        document: response.mediaUrl!,
        caption: response.caption,
        parse_mode: response.parseMode,
        ...(response.buttons && { reply_markup: response.buttons }),
      });
    }

    // 处理自定义键盘响应
    if (response.types.includes(ResponseType.KEYBOARD)) {
      const keyboard = {
        keyboard: response.buttons?.buttons || [],
        resize_keyboard: response.resizeKeyboard,
        one_time_keyboard: response.oneTimeKeyboard,
        selective: response.selective,
        input_field_placeholder: response.inputPlaceholder,
      };

      result = await telegram.sendMessage({
        chat_id: "test",
        text: response.content,
        reply_markup: keyboard,
      });
    }

    // 返回测试结果
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    // 错误处理
    console.error("命令测试失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "命令测试失败",
      }),
      { status: 500 }
    );
  }
} 