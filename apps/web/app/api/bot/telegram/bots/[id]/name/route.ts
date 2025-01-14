import { NextResponse } from "next/server";
import { getBotToken } from "../../../../../../../lib/bot-token";
import { cache } from "../../../../../../../lib/cache";

// 获取机器人名称
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cacheKey = `bot_name:${params.id}`;
  
  // 尝试从缓存获取
  const cachedName = cache.get<string>(cacheKey);
  if (cachedName !== null) {
    return NextResponse.json({ 
      success: true,
      data: { name: cachedName }
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

    const response = await fetch(`https://api.telegram.org/bot${token}/getMyName`);
    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.description || '获取名称失败' },
        { status: 400 }
      );
    }

    const name = result.result.name || '';
    // 缓存结果(1小时过期)
    cache.set(cacheKey, name, 3600);

    return NextResponse.json({ 
      success: true,
      data: { name }
    });
  } catch (error) {
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
    const token = await getBotToken(params.id);
    if (!token) {
      return NextResponse.json(
        { success: false, message: '无效的机器人Token' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.description || '设置名称失败' },
        { status: 400 }
      );
    }

    // 更新缓存
    cache.set(`bot_name:${params.id}`, name, 3600);

    return NextResponse.json({ 
      success: true, 
      message: '设置名称成功'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '设置名称失败' },
      { status: 500 }
    );
  }
} 