import { NextResponse } from "next/server";
import { getBotToken } from "../../../../../../../lib/bot-token";

// 获取机器人短描述
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取完整的bot token
    const token = await getBotToken(params.id);
    if (!token) {
      console.error(`获取bot token失败: botId=${params.id}`);
      return NextResponse.json(
        { success: false, message: '无效的机器人Token' },
        { status: 400 }
      );
    }

    // 调用Telegram Bot API获取短描述
    const response = await fetch(`https://api.telegram.org/bot${token}/getMyShortDescription`);
    const result = await response.json();

    if (!result.ok) {
      console.error(`获取机器人短描述失败: ${result.description}`);
      return NextResponse.json(
        { success: false, message: result.description || '获取短描述失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: {
        short_description: result.result.short_description || ''
      }
    });
  } catch (error) {
    console.error('获取机器人短描述失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '获取短描述失败' },
      { status: 500 }
    );
  }
}

// 设置机器人短描述
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { short_description } = await request.json();
    
    // 获取完整的bot token
    const token = await getBotToken(params.id);
    if (!token) {
      console.error(`获取bot token失败: botId=${params.id}`);
      return NextResponse.json(
        { success: false, message: '无效的机器人Token' },
        { status: 400 }
      );
    }

    // 调用Telegram Bot API设置短描述
    const response = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        short_description: short_description
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error(`设置机器人短描述失败: ${result.description}`);
      return NextResponse.json(
        { success: false, message: result.description || '设置短描述失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: '设置短描述成功'
    });
  } catch (error) {
    console.error('设置机器人短描述失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '设置短描述失败' },
      { status: 500 }
    );
  }
} 