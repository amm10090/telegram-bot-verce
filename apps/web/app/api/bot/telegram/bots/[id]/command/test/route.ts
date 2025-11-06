import { NextResponse } from "next/server";
import { TelegramClient } from "@/lib/telegram";
import { ResponseType, Button, CommandResponse } from "@/types/bot";
import { connectDB } from "@/lib/db";
import BotModel from "@/models/bot";
import { isValidObjectId } from "mongoose";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const botToken = authHeader?.startsWith('Bot ') ? authHeader.slice(4) : null;
    
    if (!botToken) {
      return NextResponse.json(
        { error: "缺少机器人Token" },
        { status: 400 }
      );
    }

    // 验证 Bot ID
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "无效的机器人ID" },
        { status: 400 }
      );
    }

    // 验证 Bot 是否存在且 Token 是否匹配
    await connectDB();
    const bot = await BotModel.findById(id);
    if (!bot) {
      return NextResponse.json(
        { error: "机器人不存在" },
        { status: 404 }
      );
    }

    if (bot.token !== botToken) {
      return NextResponse.json(
        { error: "Token 不匹配" },
        { status: 403 }
      );
    }

    const { command, response, receiverId } = await request.json() as {
      command: string;
      response: CommandResponse;
      receiverId: string;
    };
    
    if (!receiverId) {
      return NextResponse.json(
        { error: "请提供接收者ID" },
        { status: 400 }
      );
    }

    const telegram = new TelegramClient(botToken);
    const chat_id = receiverId;

    // 格式化按钮数据
    let replyMarkup;
    if (response.buttons?.buttons) {
      if (response.types.includes(ResponseType.INLINE_BUTTONS)) {
        // 内联按钮格式
        replyMarkup = {
          inline_keyboard: (response.buttons.buttons as Button[][]).map(row => 
            row.map((button) => ({
              text: button.text,
              ...(button.type === 'url' ? { url: button.value } : { callback_data: button.value })
            }))
          )
        };
      } else if (response.types.includes(ResponseType.KEYBOARD)) {
        // 自定义键盘格式
        replyMarkup = {
          keyboard: (response.buttons.buttons as Button[][]).map(row => 
            row.map((button) => ({ text: button.text }))
          ),
          resize_keyboard: response.resizeKeyboard ?? true,
          one_time_keyboard: response.oneTimeKeyboard ?? false,
          selective: response.selective ?? false,
          input_field_placeholder: response.inputPlaceholder
        };
      }
    }

    for (const type of response.types) {
      try {
        switch (type) {
          case ResponseType.TEXT:
          case ResponseType.MARKDOWN:
          case ResponseType.HTML:
            await telegram.sendMessage({
              chat_id,
              text: response.content || '',
              parse_mode: response.parseMode || undefined,
              reply_markup: replyMarkup
            });
            break;

          case ResponseType.PHOTO:
            await telegram.sendPhoto({
              chat_id,
              photo: response.mediaUrl || '',
              caption: response.caption || '',
              parse_mode: response.parseMode || undefined,
              reply_markup: replyMarkup
            });
            break;

          case ResponseType.VIDEO:
            await telegram.sendVideo({
              chat_id,
              video: response.mediaUrl || '',
              caption: response.caption || '',
              parse_mode: response.parseMode || undefined,
              reply_markup: replyMarkup
            });
            break;

          case ResponseType.DOCUMENT:
            await telegram.sendDocument({
              chat_id,
              document: response.mediaUrl || '',
              caption: response.caption || '',
              parse_mode: response.parseMode || undefined,
              reply_markup: replyMarkup
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