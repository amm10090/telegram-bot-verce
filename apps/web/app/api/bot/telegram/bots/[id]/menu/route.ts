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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { success: false, message: '机器人不存在' },
        { status: 404 }
      );
    }

    // 更新菜单
    bot.menus = (body.menus || []).map((menu: any) => ({
      text: menu.text,
      command: menu.command,
      url: menu.url,
      order: menu.order,
    }));

    await bot.save();

    // 同步到Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${bot.token}/setMyCommands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands: bot.menus.map(menu => ({
            command: menu.command,
            description: menu.text
          }))
        }),
      }
    );

    if (!telegramResponse.ok) {
      return NextResponse.json(
        { success: false, message: '同步到Telegram失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: bot.menus,
      message: '菜单配置已更新'
    });
  } catch (error) {
    console.error('更新菜单失败:', error);
    return NextResponse.json(
      { success: false, message: '更新菜单失败' },
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