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

    await connectDB();

    // 查找并更新 Bot
    const bot = await BotModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).lean();

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
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新 Bot 失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '更新 Bot 失败',
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

    // 删除 Bot
    const bot = await BotModel.findByIdAndDelete(id).lean();

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
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除 Bot 失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除 Bot 失败',
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    );
  }
} 