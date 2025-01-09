/**
 * Telegram Bot 菜单管理 API 路由
 * 
 * 该模块提供了以下功能：
 * - 获取机器人的菜单列表
 * - 创建/更新菜单项
 * - 删除菜单项
 * - 同步菜单到 Telegram
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { isValidObjectId, Types } from 'mongoose';
import { MenuItem, CommandResponse, ResponseType } from '@/types/bot';

/**
 * 菜单项输入接口
 * 定义了创建或更新菜单项时需要的数据结构
 */
interface MenuItemInput {
  id?: string;                // 菜单项ID,更新时必需
  text: string;               // 菜单项显示文本
  command: string;            // 菜单命令(以/开头)
  response?: CommandResponse; // 响应配置
  order?: number;            // 排序序号
}

/**
 * 响应类型分组定义
 * 将不同类型的响应按功能分组,便于管理和验证
 */
const RESPONSE_TYPE_GROUPS = {
  TEXT: [ResponseType.TEXT] as ResponseType[],                                    // 纯文本
  FORMATTED: [ResponseType.MARKDOWN, ResponseType.HTML] as ResponseType[],        // 格式化文本
  MEDIA: [ResponseType.PHOTO, ResponseType.VIDEO, ResponseType.DOCUMENT] as ResponseType[],  // 媒体文件
  INTERACTIVE: [ResponseType.INLINE_BUTTONS, ResponseType.KEYBOARD] as ResponseType[]        // 交互元素
} as const;

/**
 * 验证响应类型的合法性
 * @param types 响应类型数组
 * @returns 验证结果对象,包含验证状态和错误信息
 */
function validateResponseTypes(types: ResponseType[]): { valid: boolean; message?: string } {
  // 检查是否为空
  if (!Array.isArray(types) || types.length === 0) {
    return { valid: false, message: '请选择一种响应类型' };
  }

  // 检查是否只选择了一种类型
  if (types.length > 1) {
    return { valid: false, message: '只能选择一种主要响应类型' };
  }

  const type = types[0]!;
  
  // 验证类型是否在支持的范围内
  const allTypes = Object.values(ResponseType);
  if (!allTypes.includes(type)) {
    return { valid: false, message: '不支持的响应类型' };
  }

  return { valid: true };
}

/**
 * 同步菜单配置到 Telegram
 * 使用 Telegram Bot API 更新机器人的命令列表
 * 
 * @param token Bot的访问令牌
 * @param menus 要同步的菜单列表
 */
async function syncToTelegram(token: string, menus: MenuItem[]) {
  const maxRetries = 3;        // 最大重试次数
  const retryDelay = 1000;     // 基础重试延迟(毫秒)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/setMyCommands`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'TGBot-WebApp/1.0'
          },
          body: JSON.stringify({
            commands: menus.map(menu => ({
              command: menu.command.toLowerCase(),
              description: menu.text.slice(0, 256)  // Telegram 限制描述最长 256 字符
            }))
          }),
          signal: AbortSignal.timeout(5000)  // 5秒超时
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(`Telegram同步失败 (尝试 ${attempt}/${maxRetries}):`, error);
        if (attempt === maxRetries) {
          throw new Error(`Telegram API 错误: ${JSON.stringify(error)}`);
        }
      } else {
        console.log('Telegram同步成功');
        return;
      }
    } catch (error) {
      console.error(`同步失败 (尝试 ${attempt}/${maxRetries}):`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }

    // 在重试之前等待,延迟时间随重试次数增加
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
}

/**
 * GET 处理器 - 获取机器人的菜单列表
 * 
 * @param req NextRequest 请求对象
 * @param params 路由参数,包含机器人ID
 * @returns 包含菜单列表的 JSON 响应
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // 验证机器人ID格式
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { success: false, message: '无效的Bot ID' },
        { status: 400 }
      );
    }

    // 查询机器人菜单
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

/**
 * POST 处理器 - 创建或更新菜单项
 * 
 * @param request Request 请求对象
 * @param params 路由参数,包含机器人ID
 * @returns 包含更新后菜单项的 JSON 响应
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await BotModel.startSession();
  try {
    await connectDB();
    const body = await request.json() as MenuItemInput;
    let updatedMenu: MenuItem | undefined;
    
    // 验证响应类型
    if (body.response?.types) {
      const validation = validateResponseTypes(body.response.types);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, message: validation.message },
          { status: 400 }
        );
      }

      // 验证响应内容
      const type = body.response.types[0]!;
      
      // 验证文本内容
      if ([...RESPONSE_TYPE_GROUPS.TEXT, ...RESPONSE_TYPE_GROUPS.FORMATTED].includes(type)) {
        if (!body.response.content?.trim()) {
          return NextResponse.json(
            { success: false, message: '请输入响应内容' },
            { status: 400 }
          );
        }
      }

      // 验证媒体内容
      if (RESPONSE_TYPE_GROUPS.MEDIA.includes(type)) {
        if (!body.response.mediaUrl?.trim()) {
          return NextResponse.json(
            { success: false, message: '请提供媒体文件 URL' },
            { status: 400 }
          );
        }
      }

      // 验证按钮配置
      if (body.response.buttons) {
        const { buttons } = body.response.buttons;
        
        // 验证行数限制
        if (buttons.length > 8) {
          return NextResponse.json(
            { success: false, message: '按钮行数不能超过 8 行' },
            { status: 400 }
          );
        }

        // 验证每行按钮数限制
        for (const row of buttons) {
          if (row.length > 8) {
            return NextResponse.json(
              { success: false, message: '每行按钮数不能超过 8 个' },
              { status: 400 }
            );
          }

          // 验证按钮配置
          for (const button of row) {
            if (!button.text?.trim()) {
              return NextResponse.json(
                { success: false, message: '按钮文本不能为空' },
                { status: 400 }
              );
            }

            if (button.text.length > 64) {
              return NextResponse.json(
                { success: false, message: '按钮文本不能超过 64 个字符' },
                { status: 400 }
              );
            }

            if (button.type === 'url' && !button.value?.trim()) {
              return NextResponse.json(
                { success: false, message: '请输入按钮链接' },
                { status: 400 }
              );
            }

            if (button.type === 'callback' && !button.value?.trim()) {
              return NextResponse.json(
                { success: false, message: '请输入回调数据' },
                { status: 400 }
              );
            }

            if (button.type === 'callback' && button.value.length > 64) {
              return NextResponse.json(
                { success: false, message: '回调数据不能超过 64 个字符' },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // 使用事务处理菜单更新
    await session.withTransaction(async () => {
      const bot = await BotModel.findById(params.id).session(session);
      if (!bot) throw new Error('BOT_NOT_FOUND');

      // 验证命令格式
      if (!body.command?.match(/^\/[a-z0-9_]{1,31}$/)) {
        throw new Error('INVALID_COMMAND');
      }

      if (!Array.isArray(bot.menus)) bot.menus = [];

      // 检查命令是否已存在
      const existingMenuIndex = bot.menus.findIndex(menu => 
        menu.command.toLowerCase() === body.command.toLowerCase() && 
        (!body.id || (menu._id && menu._id.toString() !== body.id))
      );

      if (existingMenuIndex !== -1) throw new Error('COMMAND_EXISTS');

      if (body.id) {
        // 更新现有菜单项
        const updateResult = await BotModel.findOneAndUpdate(
          { 
            _id: params.id,
            'menus._id': new Types.ObjectId(body.id)
          },
          {
            $set: {
              'menus.$.text': body.text,
              'menus.$.command': body.command.toLowerCase(),
              'menus.$.response': {
                types: body.response?.types || [],
                content: body.response?.content || '',
                ...(body.response?.buttons && { buttons: body.response.buttons }),
                ...(body.response?.parseMode && { parseMode: body.response.parseMode }),
                ...(body.response?.mediaUrl && { mediaUrl: body.response.mediaUrl }),
                ...(body.response?.caption && { caption: body.response.caption }),
                ...(body.response?.inputPlaceholder && { inputPlaceholder: body.response.inputPlaceholder }),
                ...(body.response?.resizeKeyboard !== undefined && { resizeKeyboard: body.response.resizeKeyboard }),
                ...(body.response?.oneTimeKeyboard !== undefined && { oneTimeKeyboard: body.response.oneTimeKeyboard }),
                ...(body.response?.selective !== undefined && { selective: body.response.selective })
              }
            }
          },
          { new: true, session }
        );
        
        if (!updateResult) throw new Error('MENU_NOT_FOUND');
        updatedMenu = updateResult.menus.find(m => m?._id?.toString() === body.id);
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
            ...(body.response?.parseMode && { parseMode: body.response.parseMode }),
            ...(body.response?.mediaUrl && { mediaUrl: body.response.mediaUrl }),
            ...(body.response?.caption && { caption: body.response.caption }),
            ...(body.response?.inputPlaceholder && { inputPlaceholder: body.response.inputPlaceholder }),
            ...(body.response?.resizeKeyboard !== undefined && { resizeKeyboard: body.response.resizeKeyboard }),
            ...(body.response?.oneTimeKeyboard !== undefined && { oneTimeKeyboard: body.response.oneTimeKeyboard }),
            ...(body.response?.selective !== undefined && { selective: body.response.selective })
          },
          order: bot.menus.length
        };
        
        await BotModel.findByIdAndUpdate(
          params.id,
          { $push: { menus: newMenu } },
          { session }
        );
        
        updatedMenu = newMenu;
      }

      // 异步同步到 Telegram
      setImmediate(() => syncToTelegram(bot.token, bot.menus));

      return updatedMenu;
    }, {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedMenu,
      message: body.id ? '菜单项已更新' : '菜单项已创建'
    });
  } catch (error) {
    console.error('处理菜单项失败:', error);
    await session.endSession();

    // 错误信息映射
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