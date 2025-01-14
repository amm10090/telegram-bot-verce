import { NextResponse } from "next/server";
import { getBotToken } from "../../../../../../../lib/bot-token";
import { cache } from "../../../../../../../lib/cache";

// 获取机器人短描述
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cacheKey = `bot_desc:${params.id}`;
  
  // 尝试从缓存获取
  const cachedDesc = cache.get<string>(cacheKey);
  if (cachedDesc !== null) {
    return NextResponse.json({ 
      success: true,
      data: { short_description: cachedDesc }
    });
  }

  try {
    const token = await getBotToken(params.id);
    if (!token) {
      return NextResponse.json(
        { success: false, message: '无效的机器人Token' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/getMyShortDescription`);
    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.description || '获取短描述失败' },
        { status: 400 }
      );
    }

    const desc = result.result.short_description || '';
    // 缓存结果(1小时过期)
    cache.set(cacheKey, desc, 3600);

    return NextResponse.json({ 
      success: true,
      data: { short_description: desc }
    });
  } catch (error) {
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
    const token = await getBotToken(params.id);
    if (!token) {
      return NextResponse.json(
        { success: false, message: '无效的机器人Token' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ short_description }),
    });

    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.description || '设置短描述失败' },
        { status: 400 }
      );
    }

    // 更新缓存
    cache.set(`bot_desc:${params.id}`, short_description, 3600);

    return NextResponse.json({ 
      success: true, 
      message: '设置短描述成功'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '设置短描述失败' },
      { status: 500 }
    );
  }
} 