import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId } from 'mongoose';
import { BotResponse } from '@/types/bot';

// 将数据库文档转换为API响应格式
function transformBotToResponse(bot: any): BotResponse {
  return {
    id: bot._id.toString(),
    name: bot.name,
    token: bot.token,
    apiKey: bot.apiKey,
    isEnabled: bot.isEnabled,
    status: bot.status,
    settings: bot.settings,
    menus: bot.menus || [],
    createdAt: bot.createdAt.toISOString(),
    updatedAt: bot.updatedAt.toISOString(),
    lastUsed: bot.lastUsed?.toISOString(),
  };
}

// 错误响应处理函数
function errorResponse(status: number, message: string, error: string, details?: any) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error,
      details,
      timestamp: new Date().toISOString()
    }),
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
      }
    }
  );
}

// 成功响应处理函数
function successResponse(data: any, message?: string, pagination?: any) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
      pagination
    }),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
      }
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
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
    const sort: any = {
      [sortBy]: sortOrder.toLowerCase() === 'desc' ? -1 : 1
    };

    await connectDB();

    // 计算分页
    const skip = (page - 1) * limit;

    // 分别执行查询
    const total = await BotModel.countDocuments(query);
    const bots = await BotModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // 转换响应格式
    const transformedBots = bots.map(transformBotToResponse);

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);

    return successResponse(transformedBots, '获取机器人列表成功', {
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.error('获取机器人列表失败:', error);
    return errorResponse(500, '获取机器人列表失败', 'INTERNAL_SERVER_ERROR', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await connectDB();

    // 使用会话创建机器人
    const session = await BotModel.startSession();
    let bot;

    try {
      await session.withTransaction(async () => {
        // 检查 token 是否已存在
        const existingBot = await BotModel.findOne({ token: body.token }).session(session);

        if (existingBot) {
          throw new Error('TOKEN_EXISTS');
        }

        // 创建机器人
        bot = await BotModel.create([{
          name: body.name,
          token: body.token,
          status: 'inactive',
          settings: body.settings || {},
          menus: [{
            text: "开始使用机器人",
            command: "/start",
            order: 0
          }]
        }], { session });

        bot = bot[0]; // 因为create返回的是数组
      });

      await session.endSession();
      return successResponse(bot, '创建机器人成功');
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('创建机器人失败:', error);
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXISTS') {
        return errorResponse(400, 'Token已存在', 'TOKEN_EXISTS');
      }
    }
    return errorResponse(500, '创建机器人失败', 'INTERNAL_SERVER_ERROR', error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(400, '无效的ID列表', 'INVALID_IDS');
    }

    // 验证所有ID的格式
    const validIds = ids.every(id => isValidObjectId(id));
    if (!validIds) {
      return errorResponse(400, '存在无效的ID格式', 'INVALID_ID_FORMAT');
    }

    await connectDB();

    // 使用会话批量删除机器人及其相关数据
    const session = await BotModel.startSession();
    try {
      await session.withTransaction(async () => {
        // 删除相关的菜单（假设菜单是内嵌文档，如果是独立集合需要单独删除）
        await BotModel.updateMany(
          { _id: { $in: ids } },
          { $set: { menus: [] } },
          { session }
        );

        // 删除机器人
        await BotModel.deleteMany(
          { _id: { $in: ids } },
          { session }
        );
      });

      await session.endSession();
      return successResponse({ deletedCount: ids.length }, '批量删除成功');
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('批量删除机器人失败:', error);
    return errorResponse(500, '批量删除机器人失败', 'INTERNAL_SERVER_ERROR', error);
  }
} 