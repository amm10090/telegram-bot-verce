import { NextResponse } from "next/server";
import { getBotToken } from "../../../../../../../lib/bot-token";

// 获取机器人名称
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

    // 调用Telegram Bot API获取名称
    const response = await fetch(`https://api.telegram.org/bot${token}/getMyName`);
    const result = await response.json();

    if (!result.ok) {
      console.error(`获取机器人名称失败: ${result.description}`);
      return NextResponse.json(
        { success: false, message: result.description || '获取名称失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: {
        name: result.result.name || ''
      }
    });
  } catch (error) {
    console.error('获取机器人名称失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '获取名称失败' },
      { status: 500 }
    );
  }
}

// 设置机器人名称
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    
    // 获取完整的bot token
    const token = await getBotToken(params.id);
    if (!token) {
      console.error(`获取bot token失败: botId=${params.id}`);
      return NextResponse.json(
        { success: false, message: '无效的机器人Token' },
        { status: 400 }
      );
    }

    // 调用Telegram Bot API设置名称
    const response = await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error(`设置机器人名称失败: ${result.description}`);
      return NextResponse.json(
        { success: false, message: result.description || '设置名称失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: '设置名称成功'
    });
  } catch (error) {
    console.error('设置机器人名称失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '设置名称失败' },
      { status: 500 }
    );
  }
} 