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

const RESPONSE_TYPE_GROUPS = {
  BASIC: [ResponseType.TEXT, ResponseType.MARKDOWN, ResponseType.HTML, ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT] as ResponseType[],
  INTERACTIVE: [ResponseType.INLINE_BUTTONS, ResponseType.KEYBOARD] as ResponseType[]
} as const;

// 验证响应类型组合的合法性
function validateResponseTypes(types: ResponseType[]): { valid: boolean; message?: string } {
  if (!types || types.length === 0) {
    return { valid: false, message: '至少需要选择一种响应类型' };
  }

  const basicTypes = types.filter(type => RESPONSE_TYPE_GROUPS.BASIC.includes(type));
  const interactiveTypes = types.filter(type => RESPONSE_TYPE_GROUPS.INTERACTIVE.includes(type));

  // 检查基础类型
  if (basicTypes.length === 0) {
    return { valid: false, message: '必须包含至少一种基础类型' };
  }

  // 检查交互类型
  if (interactiveTypes.length > 1) {
    return { valid: false, message: '交互类型只能选择其中一种' };
  }

  // 检查文本类型互斥
  const textTypes = types.filter(type => [ResponseType.TEXT, ResponseType.MARKDOWN, ResponseType.HTML].includes(type));
  if (textTypes.length > 1) {
    return { valid: false, message: '文本类型(纯文本、Markdown、HTML)只能选择其中一种' };
  }

  // 检查媒体类型互斥
  const mediaTypes = types.filter(type => [ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT].includes(type));
  if (mediaTypes.length > 1) {
    return { valid: false, message: '媒体类型(图片、视频、文档)只能选择其中一种' };
  }

  return { valid: true };
}

// 异步同步到 Telegram
async function syncToTelegram(token: string, menus: MenuItem[]) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setMyCommands`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: menus.map(menu => ({
            command: menu.command.toLowerCase(),
            description: menu.text.slice(0, 256)
          }))
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram同步失败:', error);
    }
  } catch (error) {
    console.error('Telegram同步请求失败:', error);
  }
}

// 获取菜单列表
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    const bot = await BotModel.findById(params.id)
      .select('menus')
      .lean();

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

// 构建响应对象
function buildResponseData(response?: CommandResponse): CommandResponse {
  const isMediaType = response?.types?.some(type => 
    [ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT].includes(type)
  );

  const baseResponse = {
    types: response?.types || [],
    content: isMediaType ? '' : (response?.content || ''),
  };

  if (isMediaType) {
    return {
      ...baseResponse,
      mediaUrl: response?.mediaUrl || '',
      caption: response?.caption || '',
      ...(response?.buttons && { buttons: response.buttons }),
      ...(response?.parseMode && { parseMode: response.parseMode }),
    };
  }

  return {
    ...baseResponse,
    ...(response?.buttons && { buttons: response.buttons }),
    ...(response?.parseMode && { parseMode: response.parseMode }),
    ...(response?.inputPlaceholder && { inputPlaceholder: response.inputPlaceholder }),
    ...(response?.resizeKeyboard !== undefined && { resizeKeyboard: response.resizeKeyboard }),
    ...(response?.oneTimeKeyboard !== undefined && { oneTimeKeyboard: response.oneTimeKeyboard }),
    ...(response?.selective !== undefined && { selective: response.selective })
  };
}

// 更新单个菜单项
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await BotModel.startSession();
  try {
    await connectDB();
    const body = await request.json() as MenuItemInput;
    let updatedMenu: MenuItem | undefined;
    
    if (body.response?.types) {
      const validation = validateResponseTypes(body.response.types);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, message: validation.message },
          { status: 400 }
        );
      }
    }

    await session.withTransaction(async () => {
      const bot = await BotModel.findById(params.id)
        .session(session)
        .read('primary');  // 强制使用主节点读取
        
      if (!bot) throw new Error('BOT_NOT_FOUND');

      if (!body.command?.match(/^\/[a-z0-9_]{1,31}$/)) {
        throw new Error('INVALID_COMMAND');
      }

      if (!Array.isArray(bot.menus)) bot.menus = [];

      const existingMenuIndex = bot.menus.findIndex(menu => 
        menu.command.toLowerCase() === body.command.toLowerCase() && 
        (!body.id || (menu._id && menu._id.toString() !== body.id))
      );

      if (existingMenuIndex !== -1) throw new Error('COMMAND_EXISTS');

      const responseData = buildResponseData(body.response);

      if (body.id) {
        const updateResult = await BotModel.findOneAndUpdate(
          { 
            _id: params.id,
            'menus._id': new Types.ObjectId(body.id)
          },
          {
            $set: {
              'menus.$.text': body.text,
              'menus.$.command': body.command.toLowerCase(),
              'menus.$.response': responseData
            }
          },
          { 
            new: true, 
            session,
            readPreference: 'primary'  // 强制使用主节点读取
          }
        );
        
        if (!updateResult) throw new Error('MENU_NOT_FOUND');
        updatedMenu = updateResult.menus.find(m => m?._id?.toString() === body.id);
      } else {
        const newMenu: MenuItem = {
          _id: new Types.ObjectId(),
          text: body.text,
          command: body.command.toLowerCase(),
          response: responseData,
          order: bot.menus.length
        };
        
        await BotModel.findByIdAndUpdate(
          params.id,
          { $push: { menus: newMenu } },
          { 
            session,
            readPreference: 'primary'  // 强制使用主节点读取
          }
        );
        
        updatedMenu = newMenu;
      }

      setImmediate(() => syncToTelegram(bot.token, bot.menus));
      return updatedMenu;
    }, {
      readPreference: 'primary'  // 设置事务的读取首选项
    });

    await session.endSession();  // 确保会话被正确关闭
    return NextResponse.json({ 
      success: true, 
      data: updatedMenu,
      message: body.id ? '菜单项已更新' : '菜单项已创建'
    });
  } catch (error) {
    console.error('处理菜单项失败:', error);
    await session.endSession();  // 确保错误时也关闭会话

    const errorMessages = {
      'BOT_NOT_FOUND': { message: '机器人不存在', status: 404 },
      'INVALID_COMMAND': { message: '命令格式无效', status: 400 },
      'COMMAND_EXISTS': { message: '命令已存在', status: 400 },
      'MENU_NOT_FOUND': { message: '菜单项不存在', status: 404 }
    } as const;

    const errorInfo = error instanceof Error 
      ? (errorMessages[error.message as keyof typeof errorMessages] ?? { message: '处理菜单项失败', status: 500 })
      : { message: '处理菜单项失败', status: 500 };

    return NextResponse.json(
      { success: false, message: errorInfo.message },
      { status: errorInfo.status }
    );
  }
}

// 更新整个菜单列表
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await BotModel.startSession();
  try {
    await connectDB();
    const body = await request.json();
    
    await session.withTransaction(async () => {
      const bot = await BotModel.findById(params.id).session(session);
      if (!bot) throw new Error('BOT_NOT_FOUND');

      const newMenus = (body.menus || []).map((menu: MenuItemInput) => ({
        _id: menu.id ? new Types.ObjectId(menu.id) : new Types.ObjectId(),
        text: menu.text,
        command: menu.command,
        response: menu.response,
        order: menu.order || 0
      }));

      await BotModel.findByIdAndUpdate(
        params.id,
        { $set: { menus: newMenus } },
        { session }
      );

      // 异步同步到 Telegram
      setImmediate(() => syncToTelegram(bot.token, newMenus));
    }, {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });

    await session.endSession();
    return NextResponse.json({ 
      success: true, 
      data: body.menus,
      message: '菜单配置已更新'
    });
  } catch (error) {
    await session.endSession();
    console.error('更新菜单失败:', error);

    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: '机器人不存在' },
        { status: 404 }
      );
    }

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
  const session = await BotModel.startSession();
  try {
    await connectDB();

    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    await session.withTransaction(async () => {
      const bot = await BotModel.findByIdAndUpdate(
        params.id,
        { $set: { menus: [] } },
        { session, new: true }
      );

      if (!bot) throw new Error('BOT_NOT_FOUND');

      // 异步同步到 Telegram
      setImmediate(() => syncToTelegram(bot.token, []));
    });

    await session.endSession();
    return NextResponse.json({
      success: true,
      message: '删除菜单成功'
    });
  } catch (error) {
    await session.endSession();
    console.error('删除菜单失败:', error);

    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Bot不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: '删除菜单失败' },
      { status: 500 }
    );
  }
} 