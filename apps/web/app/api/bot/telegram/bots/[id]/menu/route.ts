import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId } from 'mongoose';

// 获取菜单列表
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(id).lean();
    if (!bot) {
      return NextResponse.json(
        { success: false, message: 'Bot不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bot.menus || [],
      message: '获取菜单列表成功'
    });
  } catch (error) {
    console.error('获取菜单列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取菜单列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 更新菜单列表
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { menus } = body;

    if (!Array.isArray(menus)) {
      return NextResponse.json(
        { success: false, message: '无效的菜单数据' },
        { status: 400 }
      );
    }

    // 验证菜单数据格式
    const isValidMenu = menus.every(menu => 
      typeof menu.text === 'string' && 
      typeof menu.command === 'string' && 
      typeof menu.order === 'number'
    );

    if (!isValidMenu) {
      return NextResponse.json(
        { success: false, message: '菜单数据格式错误' },
        { status: 400 }
      );
    }

    // 使用事务更新菜单
    const session = await BotModel.startSession();
    try {
      await session.withTransaction(async () => {
        const bot = await BotModel.findById(id).session(session);
        if (!bot) {
          throw new Error('BOT_NOT_FOUND');
        }

        bot.menus = menus;
        await bot.save({ session });
      });

      await session.endSession();
      return NextResponse.json({
        success: true,
        message: '更新菜单成功'
      });
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('更新菜单失败:', error);
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Bot不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: '更新菜单失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 删除菜单
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    const session = await BotModel.startSession();
    try {
      await session.withTransaction(async () => {
        const bot = await BotModel.findById(id).session(session);
        if (!bot) {
          throw new Error('BOT_NOT_FOUND');
        }

        bot.menus = [];
        await bot.save({ session });
      });

      await session.endSession();
      return NextResponse.json({
        success: true,
        message: '删除菜单成功'
      });
    } catch (error) {
      await session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('删除菜单失败:', error);
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Bot不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: '删除菜单失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 