import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { Types } from 'mongoose';

interface OrderItem {
  id: string;
  order: number;
}

interface MenuDoc {
  _id: Types.ObjectId;
  order: number;
  command: string;
  text: string;
}

interface BotDoc {
  menus: MenuDoc[];
  token: string;
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (!Array.isArray(body.orders)) {
      return NextResponse.json(
        { success: false, message: '无效的排序数据格式' },
        { status: 400 }
      );
    }

    const orders = body.orders as OrderItem[];
    
    // 1. 使用投影只获取必要字段
    const bot = await BotModel.findById(
      context.params.id,
      { menus: 1, token: 1 }
    ).lean() as BotDoc;

    if (!bot || !bot.menus) {
      return NextResponse.json(
        { success: false, message: '机器人不存在或没有菜单配置' },
        { status: 404 }
      );
    }

    // 2. 验证ID并创建更新操作
    const validIds = bot.menus.map(menu => (menu._id as Types.ObjectId).toString());
    const allIdsValid = orders.every(order => validIds.includes(order.id));
    
    if (!allIdsValid) {
      return NextResponse.json(
        { success: false, message: '存在无效的菜单ID' },
        { status: 400 }
      );
    }

    // 3. 构建批量更新操作
    const bulkOps = orders.map(({ id, order }) => ({
      updateOne: {
        filter: {
          _id: context.params.id,
          "menus._id": id
        },
        update: {
          $set: { "menus.$.order": order }
        }
      }
    }));

    // 4. 执行批量更新
    await BotModel.bulkWrite(bulkOps, { ordered: false });

    // 5. 异步同步到Telegram
    const syncToTelegram = async () => {
      try {
        // 重新获取排序后的菜单
        const updatedBot = await BotModel.findById(
          context.params.id,
          { menus: 1 }
        ).lean();

        if (!updatedBot?.menus) return;

        // 按order排序
        const sortedMenus = [...updatedBot.menus].sort((a, b) => a.order - b.order);

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${bot.token}/setMyCommands`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              commands: sortedMenus.map(menu => ({
                command: menu.command,
                description: menu.text
              }))
            })
          }
        );

        if (!telegramResponse.ok) {
          console.error('同步到Telegram失败:', await telegramResponse.text());
        }
      } catch (error) {
        console.error('同步到Telegram失败:', error);
      }
    };

    // 异步执行Telegram同步
    syncToTelegram().catch(console.error);

    return NextResponse.json({ 
      success: true,
      message: '菜单排序更新成功'
    });

  } catch (error) {
    console.error('更新菜单排序失败:', error);
    return NextResponse.json(
      { success: false, message: '更新菜单排序失败' },
      { status: 500 }
    );
  }
} 