import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';

/**
 * 同步菜单到Telegram的API路由
 * POST /api/bot/telegram/bots/[id]/menu/sync
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // 获取机器人信息
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '机器人不存在',
        }),
        { status: 404 }
      );
    }

    // 准备命令列表
    const commands = (bot.menus || []).map(menu => ({
      command: menu.command,
      description: menu.text
    }));

    // 调用Telegram API设置命令
    const response = await fetch(
      `https://api.telegram.org/bot${bot.token}/setMyCommands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commands }),
      }
    );

    const result = await response.json();

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '同步到Telegram失败',
          error: result.description
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '菜单已同步到Telegram'
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('同步菜单失败:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '同步菜单失败',
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { status: 500 }
    );
  }
} 