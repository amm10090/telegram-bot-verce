import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { ApiResponse, IBotDocument } from '@/types/bot';

/**
 * 统一的错误响应处理
 */
function errorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
    },
    { status }
  );
}

/**
 * 统一的成功响应处理
 */
function successResponse<T>(data: T, message: string = '操作成功'): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * GET /api/bot/telegram
 * 获取系统状态和基本信息
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const stats = await BotModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
          },
        },
      },
    ]);

    const systemInfo = {
      version: '1.0.0',
      stats: stats[0] || { total: 0, active: 0, inactive: 0 },
      status: 'operational',
    };

    return successResponse(systemInfo);
  } catch (error) {
    console.error('获取系统状态失败:', error);
    return errorResponse('获取系统状态失败');
  }
}

/**
 * POST /api/bot/telegram
 * 创建新的 Bot（此路由仅用于系统级操作）
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 验证请求体
    if (!body.token || !body.name) {
      return errorResponse('缺少必要的参数', 400);
    }

    await connectDB();

    // 使用会话创建Bot
    const session = await BotModel.startSession();
    let bot;

    try {
      await session.withTransaction(async () => {
        // 检查 token 是否已存在
        const existingBot = await BotModel.findOne({ token: body.token }).session(session);
        if (existingBot) {
          throw new Error('TOKEN_EXISTS');
        }

        // 创建新的 Bot
        const newBots = await BotModel.create([{
          ...body,
          userId: body.userId, // 这里应该从认证中间件获取
        }], { session });

        bot = newBots[0];
      });

      await session.endSession();
      return successResponse(bot, 'Bot 创建成功');
    } catch (error) {
      await session.endSession();
      if (error instanceof Error && error.message === 'TOKEN_EXISTS') {
        return errorResponse('该 Bot Token 已被使用', 409);
      }
      throw error;
    }
  } catch (error) {
    console.error('创建 Bot 失败:', error);
    return errorResponse('创建 Bot 失败');
  }
}

/**
 * PUT /api/bot/telegram
 * 批量更新 Bot（此路由仅用于系统级操作）
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!Array.isArray(body.bots)) {
      return errorResponse('无效的请求格式', 400);
    }

    await connectDB();

    // 使用会话批量更新
    const session = await BotModel.startSession();
    const results: Array<IBotDocument | null> = [];

    try {
      await session.withTransaction(async () => {
        const updateResults = await Promise.all(
          body.bots.map(async (bot: any) => {
            if (!bot.id) return null;
            const result = await BotModel.findByIdAndUpdate(
              bot.id,
              { $set: bot },
              { new: true, session }
            ).lean();
            return result;
          })
        );
        results.push(...updateResults.filter(Boolean));
      });

      await session.endSession();
      return successResponse(results);
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('批量更新 Bot 失败:', error);
    return errorResponse('批量更新 Bot 失败');
  }
}

/**
 * DELETE /api/bot/telegram
 * 批量删除 Bot（此路由仅用于系统级操作）
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!Array.isArray(body.ids)) {
      return errorResponse('无效的请求格式', 400);
    }

    await connectDB();

    const result = await BotModel.deleteMany({ _id: { $in: body.ids } });

    return successResponse({
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error('批量删除 Bot 失败:', error);
    return errorResponse('批量删除 Bot 失败');
  }
} 