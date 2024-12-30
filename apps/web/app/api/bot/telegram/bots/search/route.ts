import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { ApiResponse, BotResponse } from '@/types/bot';

// 将 Bot 文档转换为 API 响应格式
function transformBotToResponse(bot: any): BotResponse {
  return {
    id: bot._id.toString(),
    name: bot.name,
    token: bot.token,
    apiKey: bot.apiKey,
    isEnabled: bot.isEnabled,
    status: bot.status,
    settings: bot.settings,
    createdAt: bot.createdAt.toISOString(),
    updatedAt: bot.updatedAt.toISOString(),
    lastUsed: bot.lastUsed?.toISOString(),
  };
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'name'; // 搜索类型：name, token, all

    // 构建查询条件
    const searchQuery: any = {};
    if (type === 'name') {
      searchQuery.name = { $regex: query, $options: 'i' };
    } else if (type === 'token') {
      searchQuery.token = { $regex: query, $options: 'i' };
    } else {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { token: { $regex: query, $options: 'i' } }
      ];
    }

    // 执行搜索
    const bots = await BotModel.find(searchQuery).lean();

    return NextResponse.json({
      success: true,
      data: bots.map(transformBotToResponse),
      message: '搜索成功'
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '搜索失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 