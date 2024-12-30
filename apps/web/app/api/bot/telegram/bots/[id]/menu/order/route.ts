import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { BotMenu } from '@/types/bot';

interface OrderItem {
  id: string;
  order: number;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    console.log('收到排序请求体:', body);
    
    const bot = await BotModel.findById(params.id);
    if (!bot || !bot.menus) {
      return NextResponse.json(
        { success: false, message: '机器人不存在或没有菜单配置' },
        { status: 404 }
      );
    }

    if (!Array.isArray(body.orders)) {
      console.log('无效的请求体格式:', body);
      return NextResponse.json(
        { success: false, message: '无效的排序数据格式' },
        { status: 400 }
      );
    }

    const orders = body.orders as OrderItem[];
    console.log('处理排序请求:', orders);

    // 验证所有id是否存在
    const validIds = bot.menus.map(menu => menu._id?.toString());
    console.log('有效的id列表:', validIds);
    
    const allIdsValid = orders.every(order => validIds.includes(order.id));
    if (!allIdsValid) {
      return NextResponse.json(
        { success: false, message: '存在无效的菜单ID' },
        { status: 400 }
      );
    }

    // 更新排序
    const updatedMenus = bot.menus.map(menu => {
      const orderItem = orders.find(o => o.id === menu._id?.toString());
      const menuObj = menu.toObject ? menu.toObject() : menu;
      return {
        ...menuObj,
        order: orderItem ? orderItem.order : menu.order
      };
    });

    // 按order排序
    updatedMenus.sort((a, b) => a.order - b.order);
    bot.menus = updatedMenus;
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
          commands: updatedMenus.map(menu => ({
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
      data: updatedMenus,
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