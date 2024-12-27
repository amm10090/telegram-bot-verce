import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId } from 'mongoose';

// 验证 Webhook URL 格式
function isValidWebhookUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 设置 Webhook
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的Bot ID',
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { url } = body;

    if (!url || !isValidWebhookUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的Webhook URL',
        },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id);
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bot不存在',
        },
        { status: 404 }
      );
    }

    // 更新 Webhook URL
    bot.settings = {
      ...bot.settings,
      webhookUrl: url,
    };
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Webhook设置成功',
    });
  } catch (error) {
    console.error('设置Webhook失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '设置Webhook失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 删除 Webhook
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的Bot ID',
        },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id);
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bot不存在',
        },
        { status: 404 }
      );
    }

    // 删除 Webhook URL
    bot.settings = {
      ...bot.settings,
      webhookUrl: undefined,
    };
    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Webhook删除成功',
    });
  } catch (error) {
    console.error('删除Webhook失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除Webhook失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// 获取 Webhook 信息
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的Bot ID',
        },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id).lean();
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bot不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        webhookUrl: bot.settings?.webhookUrl,
      },
      message: '获取Webhook信息成功',
    });
  } catch (error) {
    console.error('获取Webhook信息失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取Webhook信息失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
} 