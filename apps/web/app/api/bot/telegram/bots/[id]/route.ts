import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose, { Model } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import type { IBotDocument } from '@/types/bot';

// 获取正确类型的模型
const BotModel: Model<IBotDocument> = mongoose.models.Bot || mongoose.model<IBotDocument>('Bot');

/**
 * GET /api/bot/telegram/bots/[id]
 * 获取单个 Bot 详情
 */
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
    const bot = await (BotModel as Model<IBotDocument>).findById(id).lean();
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
      data: bot,
      message: '获取成功',
    });
  } catch (error) {
    console.error('获取 Bot 详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取 Bot 详情失败',
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bot/telegram/bots/[id]
 * 更新 Bot
 */
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

    // 检查 Bot 是否存在
    const existingBot = await (BotModel as Model<IBotDocument>).findById(id).lean();
    if (!existingBot) {
      return NextResponse.json(
        {
          success: false,
          message: '未找到指定的 Bot',
          error: 'Bot 不存在',
        },
        { status: 404 }
      );
    }

    // 如果更新包含 token，检查是否与其他 Bot 冲突
    if (body.token && body.token !== existingBot.token) {
      const tokenExists = await (BotModel as Model<IBotDocument>).findOne({
        token: body.token,
        _id: { $ne: id },
      }).lean();
      if (tokenExists) {
        return NextResponse.json(
          {
            success: false,
            message: '该 Token 已被其他 Bot 使用',
            error: 'Token 重复',
          },
          { status: 409 }
        );
      }
    }

    // 更新 Bot
    const updatedBot = await (BotModel as Model<IBotDocument>).findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true, lean: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedBot,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新 Bot 失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '更新 Bot 失败',
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bot/telegram/bots/[id]
 * 删除 Bot
 */
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

    // 查找并删除 Bot
    const deletedBot = await (BotModel as Model<IBotDocument>).findByIdAndDelete(id).lean();
    if (!deletedBot) {
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
      data: deletedBot,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除 Bot 失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除 Bot 失败',
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bot/telegram/bots/[id]
 * 更新 Bot 状态
 */
export async function PATCH(
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

    // 验证请求体
    if (typeof body.isEnabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          message: '无效的状态值',
          error: '参数错误',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // 更新 Bot 状态
    const updatedBot = await (BotModel as Model<IBotDocument>).findByIdAndUpdate(
      id,
      { $set: { isEnabled: body.isEnabled } },
      { new: true, lean: true }
    );

    if (!updatedBot) {
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
      data: updatedBot,
      message: '状态更新成功',
    });
  } catch (error) {
    console.error('更新 Bot 状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '更新 Bot 状态失败',
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
} 