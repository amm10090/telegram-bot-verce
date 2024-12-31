import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { ApiResponse, BotResponse } from '@/types/bot';
import { isValidObjectId } from 'mongoose';

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
    menus: bot.menus || [],
    createdAt: bot.createdAt.toISOString(),
    updatedAt: bot.updatedAt.toISOString(),
    lastUsed: bot.lastUsed?.toISOString(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    // 验证 ID 格式
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的 Bot ID',
          error: 'ID 格式错误',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 查找 Bot
    const bot = await BotModel.findById(id).lean();
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: '未找到指定的 Bot',
          error: 'Bot 不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformBotToResponse(bot),
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取 Bot 详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取 Bot 详情失败',
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;
    const body = await req.json();

    // 验证 ID 格式
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的 Bot ID',
          error: 'ID 格式错误',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 使用会话更新 Bot
    const session = await BotModel.startSession();
    let updatedBot;

    try {
      await session.withTransaction(async () => {
        // 如果更新token，检查是否与其他Bot冲突
        if (body.token) {
          const existingBot = await BotModel.findOne({
            _id: { $ne: id },
            token: body.token
          }).session(session);

          if (existingBot) {
            throw new Error('TOKEN_EXISTS');
          }
        }

        // 更新Bot
        updatedBot = await BotModel.findByIdAndUpdate(
          id,
          { $set: body },
          { new: true, session }
        ).lean();

        if (!updatedBot) {
          throw new Error('BOT_NOT_FOUND');
        }
      });

      await session.endSession();
      return NextResponse.json({
        success: true,
        data: transformBotToResponse(updatedBot),
        message: '更新成功',
      });
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('更新 Bot 失败:', error);
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXISTS') {
        return NextResponse.json(
          {
            success: false,
            message: 'Token已被其他Bot使用',
            error: 'TOKEN_EXISTS',
          },
          { status: 400 }
        );
      }
      if (error.message === 'BOT_NOT_FOUND') {
        return NextResponse.json(
          {
            success: false,
            message: '未找到指定的Bot',
            error: 'BOT_NOT_FOUND',
          },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      {
        success: false,
        message: '更新Bot失败',
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    // 验证 ID 格式
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的 Bot ID',
          error: 'ID 格式错误',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 使用会话删除Bot
    const session = await BotModel.startSession();
    try {
      await session.withTransaction(async () => {
        // 删除Bot
        const result = await BotModel.findByIdAndDelete(id).session(session);
        if (!result) {
          throw new Error('BOT_NOT_FOUND');
        }
      });

      await session.endSession();
      return NextResponse.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('删除 Bot 失败:', error);
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          message: '未找到指定的Bot',
          error: 'BOT_NOT_FOUND',
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: '删除Bot失败',
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    );
  }
} 