import { NextResponse } from "next/server";
import { TelegramClient } from "@/lib/telegram";
import { ResponseType } from "@/types/bot";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const botToken = request.headers.get('X-Bot-Token');
    if (!botToken) {
      return NextResponse.json(
        { error: "缺少机器人Token" },
        { status: 400 }
      );
    }

    const { command, response, receiverId } = await request.json();
    if (!receiverId) {
      return NextResponse.json(
        { error: "请提供接收者ID" },
        { status: 400 }
      );
    }

    const telegram = new TelegramClient(botToken);
    const chat_id = receiverId;

    for (const type of response.types) {
      try {
        switch (type) {
          case ResponseType.TEXT:
          case ResponseType.MARKDOWN:
          case ResponseType.HTML:
            await telegram.sendMessage({
              chat_id,
              text: response.content,
              parse_mode: response.parseMode,
              reply_markup: response.buttons
            });
            break;

          case ResponseType.PHOTO:
            await telegram.sendPhoto({
              chat_id,
              photo: response.mediaUrl,
              caption: response.caption,
              parse_mode: response.parseMode,
              reply_markup: response.buttons
            });
            break;

          case ResponseType.VIDEO:
            await telegram.sendVideo({
              chat_id,
              video: response.mediaUrl,
              caption: response.caption,
              parse_mode: response.parseMode,
              reply_markup: response.buttons
            });
            break;

          case ResponseType.DOCUMENT:
            await telegram.sendDocument({
              chat_id,
              document: response.mediaUrl,
              caption: response.caption,
              parse_mode: response.parseMode,
              reply_markup: response.buttons
            });
            break;
        }
      } catch (typeError: any) {
        console.error(`发送 ${type} 类型消息失败:`, typeError);
        throw new Error(`发送 ${type} 类型消息失败: ${typeError.message}`);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "测试消息已发送",
      details: {
        chat_id,
        types: response.types
      }
    });
  } catch (error: any) {
    console.error('测试命令失败:', error);
    return NextResponse.json(
      { 
        error: error?.message || "测试命令失败",
        details: error?.response || error?.stack
      },
      { status: 500 }
    );
  }
} 