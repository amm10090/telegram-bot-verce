import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';

/**
 * 同步菜单到Telegram的API路由
 * POST /api/bot/telegram/bots/[id]/menu/sync
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  console.log('开始同步菜单到Telegram:', { botId: resolvedParams.id });
  
  try {
    console.log('正在连接数据库...');
    await connectDB();
    console.log('数据库连接成功');

    // 获取机器人信息
    console.log('正在查询机器人信息...');
    const bot = await BotModel.findById(resolvedParams.id);
    if (!bot) {
      console.log('机器人不存在:', resolvedParams.id);
      return new Response(
        JSON.stringify({
          success: false,
          message: '机器人不存在',
          error: '找不到指定ID的机器人',
          details: {
            botId: resolvedParams.id,
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    console.log('成功获取机器人信息:', { 
      botId: bot.id,
      name: bot.name,
      menuCount: bot.menus?.length || 0 
    });

    // 准备命令列表并验证格式
    console.log('正在准备命令列表...');
    const validCommands = (bot.menus || [])
      .filter(menu => {
        // 验证命令格式
        const isValidCommand = menu.command.startsWith('/') && 
                             menu.command.length <= 32 &&
                             /^[a-zA-Z0-9_]+$/.test(menu.command.slice(1));
        
        if (!isValidCommand) {
          console.log('忽略无效的命令格式:', { 
            command: menu.command,
            reason: !menu.command.startsWith('/') ? '命令必须以/开头' :
                   menu.command.length > 32 ? '命令长度超过32字符' :
                   '命令只能包含字母、数字和下划线'
          });
        }
        
        return isValidCommand;
      })
      .map(menu => ({
        command: menu.command,
        description: menu.text
      }));

    console.log('命令列表准备完成:', { 
      totalCommands: bot.menus?.length || 0,
      validCommands: validCommands.length,
      commands: validCommands.map(cmd => ({
        command: cmd.command,
        description: cmd.description,
      }))
    });

    // 如果没有有效命令，返回错误
    if (validCommands.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '没有有效的命令可同步',
          error: '所有命令格式无效',
          details: {
            botId: bot.id,
            botName: bot.name,
            totalCommands: bot.menus?.length || 0,
            validationRules: {
              startsWith: '/',
              maxLength: 32,
              allowedChars: '字母、数字、下划线',
            },
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 调用Telegram API设置命令
    console.log('正在调用Telegram API...');
    const telegramUrl = `https://api.telegram.org/bot${bot.token}/setMyCommands`;
    console.log('请求Telegram API:', { 
      url: telegramUrl.replace(bot.token, '***token***'),
      method: 'POST',
      commandCount: validCommands.length 
    });

    const response = await fetch(
      telegramUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commands: validCommands }),
      }
    );

    const result = await response.json();
    console.log('Telegram API响应:', { 
      status: response.status,
      ok: result.ok,
      description: result.description 
    });

    if (!result.ok) {
      console.error('同步到Telegram失败:', { 
        error: result.description,
        status: response.status 
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: '同步到Telegram失败',
          error: result.description,
          details: {
            botId: bot.id,
            botName: bot.name,
            commandCount: validCommands.length,
            telegramStatus: response.status,
            telegramError: result.description,
            timestamp: new Date().toISOString()
          }
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('菜单同步成功');
    return new Response(
      JSON.stringify({
        success: true,
        message: '菜单已同步到Telegram',
        data: {
          bot: {
            id: bot.id,
            name: bot.name,
            status: bot.status,
            isEnabled: bot.isEnabled
          },
          sync: {
            totalCommands: bot.menus?.length || 0,
            validCommands: validCommands.length,
            commands: validCommands.map(cmd => ({
              command: cmd.command,
              description: cmd.description
            })),
            ignoredCommands: (bot.menus || [])
              .filter(menu => !validCommands.find(vc => vc.command === menu.command))
              .map(menu => ({
                command: menu.command,
                reason: !menu.command.startsWith('/') ? '命令必须以/开头' :
                       menu.command.length > 32 ? '命令长度超过32字符' :
                       '命令只能包含字母、数字和下划线'
              })),
            timestamp: new Date().toISOString()
          },
          telegram: {
            status: response.status,
            ok: result.ok,
            description: result.description
          }
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('同步菜单失败:', { 
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({
        success: false,
        message: '同步菜单失败',
        error: error instanceof Error ? error.message : '未知错误',
        details: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.constructor.name : '未知错误类型',
          errorStack: error instanceof Error ? error.stack : undefined
        }
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 