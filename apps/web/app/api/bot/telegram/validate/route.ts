import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types/bot';

/**
 * 验证 Telegram Bot Token 的格式
 */
function isValidTokenFormat(token: string): boolean {
  // Telegram Bot Token 格式：数字:字符串
  const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
  return tokenRegex.test(token);
}

/**
 * 调用 Telegram API 验证 Token
 */
async function verifyTokenWithTelegram(token: string) {
  try {
    console.log('正在验证Token:', token);
    
    // 使用 AbortController 实现超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('Telegram API 响应:', data);

    if (!response.ok) {
      throw new Error(data.description || 'Token 无效');
    }

    if (!data.ok || !data.result) {
      throw new Error('Telegram API 返回无效响应');
    }

    return data;
  } catch (error) {
    console.error('验证Token时出错:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('连接Telegram API超时，请检查网络连接');
      }
      if (error.message.includes('Unauthorized') || error.message.includes('Not Found')) {
        throw new Error('Token无效或已过期');
      }
      throw new Error(`验证失败: ${error.message}`);
    }
    throw new Error('验证过程中发生未知错误');
  }
}

/**
 * POST /api/bot/telegram/validate
 * 验证 Telegram Bot Token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    console.log('收到验证请求:', { token: token ? '已提供' : '未提供' });

    // 验证请求体
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: '请提供 Bot Token',
          error: '缺少必要参数',
          details: 'token字段为必填项'
        },
        { status: 400 }
      );
    }

    // 验证 Token 格式
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token 格式无效',
          error: '无效的 Token 格式',
          details: 'Token格式应为: 数字:字符串 (例如: 123456789:ABCdefGHI-JklMNOpqr)',
          providedToken: token
        },
        { status: 400 }
      );
    }

    // 验证 Token 有效性
    const botInfo = await verifyTokenWithTelegram(token);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        id: botInfo.result.id,
        username: botInfo.result.username,
        first_name: botInfo.result.first_name,
        can_join_groups: botInfo.result.can_join_groups,
        can_read_all_group_messages: botInfo.result.can_read_all_group_messages,
        supports_inline_queries: botInfo.result.supports_inline_queries,
      },
      message: 'Token 验证成功',
      rawResponse: process.env.NODE_ENV === 'development' ? botInfo : undefined
    });
  } catch (error) {
    console.error('Token 验证失败:', error);
    
    const errorResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Token 验证失败',
      error: '验证失败',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    };

    // 在开发环境下添加更多调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('完整错误响应:', errorResponse);
    }
    
    return NextResponse.json(errorResponse, { status: 400 });
  }
} 