import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId } from 'mongoose';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await BotModel.startSession();
  try {
    await connectDB();
    const body = await request.json();
    const resolvedParams = await params;
    
    if (!isValidObjectId(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    // 验证状态值
    if (!body.status || !['active', 'disabled'].includes(body.status)) {
      return NextResponse.json(
        { success: false, message: '无效的状态值' },
        { status: 400 }
      );
    }

    let updatedBot: any = null;
    
    await session.withTransaction(async () => {
      // 更新Bot状态
      const result = await BotModel.findByIdAndUpdate(
        resolvedParams.id,
        { 
          $set: { 
            status: body.status,
            isEnabled: body.status === 'active'
          } 
        },
        { new: true, session }
      ).lean();

      if (!result) {
        throw new Error('BOT_NOT_FOUND');
      }

      updatedBot = result;
    }, {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });

    await session.endSession();
    return NextResponse.json({
      success: true,
      data: {
        id: updatedBot._id.toString(),
        name: updatedBot.name,
        token: updatedBot.token,
        status: updatedBot.status,
        isEnabled: updatedBot.isEnabled
      },
      message: `机器人状态已更新为 ${body.status}`
    });
  } catch (error) {
    await session.endSession();
    console.error('更新机器人状态失败:', error);

    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: '未找到指定的Bot' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: '更新机器人状态失败' },
      { status: 500 }
    );
  }
} 