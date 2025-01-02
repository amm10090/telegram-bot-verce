import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId, Types } from 'mongoose';
import { MenuItem, CommandResponse, ResponseType } from '@/types/bot';

interface MenuItemInput {
  id?: string;
  text: string;
  command: string;
  response?: CommandResponse;
  order?: number;
}

// 在文件顶部添加响应类型组的定义
const RESPONSE_TYPE_GROUPS = {
  BASIC: [ResponseType.TEXT, ResponseType.MARKDOWN, ResponseType.HTML] as ResponseType[],
  MEDIA: [ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT] as ResponseType[],
  INTERACTIVE: [ResponseType.INLINE_BUTTONS, ResponseType.KEYBOARD] as ResponseType[]
} as const;

// 验证响应类型组合的合法性
function validateResponseTypes(types: ResponseType[]): { valid: boolean; message?: string } {
  if (!types || types.length === 0) {
    return { valid: false, message: '至少需要选择一种响应类型' };
  }

  // 基础类型互斥检查
  const basicTypes = types.filter(type => RESPONSE_TYPE_GROUPS.BASIC.includes(type));
  if (basicTypes.length > 1) {
    return { valid: false, message: '基础类型(文本、Markdown、HTML)只能选择其中一种' };
  }

  // 媒体类型互斥检查
  const mediaTypes = types.filter(type => RESPONSE_TYPE_GROUPS.MEDIA.includes(type));
  if (mediaTypes.length > 1) {
    return { valid: false, message: '媒体类型(图片、视频、文档)只能选择其中一种' };
  }

  // 交互类型互斥检查
  const interactiveTypes = types.filter(type => RESPONSE_TYPE_GROUPS.INTERACTIVE.includes(type));
  if (interactiveTypes.length > 1) {
    return { valid: false, message: '交互类型(内联按钮、自定义键盘)只能选择其中一种' };
  }

  // 必须包含基础类型
  if (basicTypes.length === 0) {
    return { valid: false, message: '必须包含至少一种基础类型(文本、Markdown、HTML)' };
  }

  return { valid: true };
}

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

// 更新单个菜单项
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json() as MenuItemInput;
    console.log('收到请求:', body);
    
    // 验证响应类型组合
    if (body.response?.types) {
      const validation = validateResponseTypes(body.response.types);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, message: validation.message || '响应类型组合无效' },
          { status: 400 }
        );
      }
    }

    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { success: false, message: '机器人不存在' },
        { status: 404 }
      );
    }

    // 验证命令格式
    if (!body.command?.match(/^\/[a-z0-9_]{1,31}$/)) {
      return NextResponse.json(
        { success: false, message: '命令格式无效' },
        { status: 400 }
      );
    }

    // 确保menus数组存在
    if (!Array.isArray(bot.menus)) {
      bot.menus = [];
    }

    // 检查命令是否已存在（排除当前项）
    const existingMenuIndex = bot.menus.findIndex(menu => 
      menu.command.toLowerCase() === body.command.toLowerCase() && 
      (!body.id || (menu._id && menu._id.toString() !== body.id))
    );

    if (existingMenuIndex !== -1) {
      return NextResponse.json(
        { success: false, message: '命令已存在' },
        { status: 400 }
      );
    }

    let updatedMenu;
    if (body.id) {
      // 更新现有菜单项
      const menuIndex = bot.menus.findIndex(menu => 
        menu._id && menu._id.toString() === body.id
      );

      if (menuIndex === -1) {
        return NextResponse.json(
          { success: false, message: '菜单项不存在' },
          { status: 404 }
        );
      }

      const existingMenu = bot.menus[menuIndex];
      if (!existingMenu?._id) {
        return NextResponse.json(
          { success: false, message: '菜单项数据无效' },
          { status: 400 }
        );
      }

      bot.menus[menuIndex] = {
        _id: existingMenu._id,
        text: body.text,
        command: body.command.toLowerCase(),
        response: {
          types: body.response?.types || existingMenu.response?.types || [],
          content: body.response?.content || existingMenu.response?.content || '',
          ...(body.response?.buttons && { buttons: body.response.buttons }),
          ...(body.response?.parseMode && { parseMode: body.response.parseMode })
        },
        order: existingMenu.order
      };
      updatedMenu = bot.menus[menuIndex];
    } else {
      // 创建新菜单项
      const newMenu: MenuItem = {
        _id: new Types.ObjectId(),
        text: body.text,
        command: body.command.toLowerCase(),
        response: {
          types: body.response?.types || [ResponseType.TEXT],
          content: body.response?.content || '',
          ...(body.response?.buttons && { buttons: body.response.buttons }),
          ...(body.response?.parseMode && { parseMode: body.response.parseMode })
        },
        order: bot.menus.length
      };
      bot.menus.push(newMenu);
      updatedMenu = newMenu;
    }

    await bot.save();

    try {
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
              description: menu.text.slice(0, 256)
            }))
          }),
        }
      );

      if (!telegramResponse.ok) {
        const telegramError = await telegramResponse.json();
        console.error('Telegram同步失败:', telegramError);
        // 不要因为 Telegram 同步失败而影响保存结果
        console.warn('Telegram同步失败，但菜单项已保存');
      }
    } catch (error) {
      // 捕获 fetch 错误但不影响保存结果
      console.error('Telegram同步请求失败:', error);
      console.warn('无法连接到Telegram，但菜单项已保存');
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedMenu,
      message: body.id ? '菜单项已更新' : '菜单项已创建'
    });
  } catch (error) {
    console.error('处理菜单项失败:', error);
    const isParseError = error instanceof Error && error.message.includes('JSON');
    return NextResponse.json(
      { 
        success: false, 
        message: isParseError ? '无效的请求数据' : '处理菜单项失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: isParseError ? 400 : 500 }
    );
  }
}

// 更新整个菜单列表
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
    bot.menus = (body.menus || []).map((menu: MenuItemInput) => ({
      _id: menu.id ? new Types.ObjectId(menu.id) : new Types.ObjectId(),
      text: menu.text,
      command: menu.command,
      response: menu.response,
      order: menu.order || 0
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
            command: menu.command.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            description: menu.text.slice(0, 256)
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