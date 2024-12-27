import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { ApiResponse, BotResponse, PaginatedApiResponse } from '@/types/bot';
import mongoose from 'mongoose';

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

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 构建查询条件
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    // 构建排序条件
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 执行分页查询
    const result = await BotModel.paginate(query, {
      page,
      limit,
      sort,
      lean: true
    });

    // 转换响应格式
    const response: PaginatedApiResponse<BotResponse> = {
      success: true,
      data: result.docs.map(transformBotToResponse),
      pagination: {
        total: result.totalDocs,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      },
      message: '获取Bot列表成功'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('获取Bot列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取Bot列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot/telegram/bots
 * 创建新的 Bot
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 验证必要字段
    if (!body.name || !body.token) {
      return NextResponse.json(
        {
          success: false,
          message: '缺少必要参数',
          error: '请提供 Bot 名称和 Token',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 检查 Token 是否已存在
    const existingBot = await BotModel.findOne({ token: body.token }).exec();
    if (existingBot) {
      return NextResponse.json(
        {
          success: false,
          message: '该 Token 已被使用',
          error: 'Token 重复',
        },
        { status: 409 }
      );
    }

    // 生成唯一的 API Key
    const apiKey = `bot_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;

    // 创建新的 Bot
    const newBot = await BotModel.create({
      name: body.name,
      token: body.token,
      apiKey: apiKey,
      userId: new mongoose.Types.ObjectId(), // 临时使用，后续需要从认证中间件获取
      isEnabled: true,
      status: 'active',
      settings: body.settings || {}
    });

    // 转换响应格式
    const response = transformBotToResponse(newBot);

    return NextResponse.json({
      success: true,
      data: response,
      message: '创建成功',
    });
  } catch (error) {
    console.error('创建 Bot 失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '创建 Bot 失败',
        error: error instanceof Error ? error.message : '服务器错误',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bot/telegram/bots
 * 批量删除 Bot
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: '请提供要删除的 Bot ID 列表',
          error: '参数错误',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await BotModel.deleteMany({
      _id: { $in: body.ids },
    }).exec();

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `成功删除 ${result.deletedCount} 个 Bot`,
    });
  } catch (error) {
    console.error('批量删除 Bot 失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '批量删除 Bot 失败',
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
} 