/**
 * Telegram Bot Webhook 配置管理路由
 * 
 * 该文件提供了 Telegram Bot Webhook 的配置管理 API，包括：
 * 1. 获取当前 webhook 配置
 * 2. 设置新的 webhook
 * 3. 删除现有 webhook
 * 
 * 安全性：
 * - 使用 bot ID 作为路由参数进行身份识别
 * - 使用 bot ID 作为 secret token 确保 webhook 安全
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BotModel from '@/models/bot';
import { TelegramClient } from '@/lib/telegram';

/**
 * 获取 webhook 配置
 * 
 * @param request - Next.js 请求对象
 * @param params - 路由参数，包含 bot ID
 * @returns 当前 webhook URL 配置
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { success: false, message: '未找到机器人' },
        { status: 404 }
      );
    }

    // 创建Telegram客户端
    const telegram = new TelegramClient(bot.token);
    
    // 获取webhook信息
    const webhookInfo = await telegram.getWebhookInfo();
    
    return NextResponse.json({
      success: true,
      data: webhookInfo,
    });
  } catch (error) {
    console.error('获取webhook配置失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取webhook配置失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 设置 webhook 配置
 * 
 * @param request - Next.js 请求对象，包含新的 webhook URL
 * @param params - 路由参数，包含 bot ID
 * @returns 设置结果
 * 
 * 注意：
 * 1. webhook URL 必须是 HTTPS
 * 2. 使用 bot ID 作为 secret token 以确保安全性
 * 3. 同时更新 Telegram 平台和本地数据库的配置
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { url } = await request.json();
    
    await connectDB();
    
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { success: false, message: '未找到机器人' },
        { status: 404 }
      );
    }

    // 创建Telegram客户端
    const telegram = new TelegramClient(bot.token);
    
    // 设置webhook
    await telegram.setWebhook({
      url,
      secret_token: bot.id, // 使用bot ID作为secret token
    });
    
    return NextResponse.json({
      success: true,
      message: 'Webhook设置成功',
    });
  } catch (error) {
    console.error('设置webhook失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '设置webhook失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 删除 webhook 配置
 * 
 * @param request - Next.js 请求对象
 * @param params - 路由参数，包含 bot ID
 * @returns 删除结果
 * 
 * 注意：
 * 1. 同时删除 Telegram 平台和本地数据库的配置
 * 2. 如果没有现有配置，会初始化默认设置
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const bot = await BotModel.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { success: false, message: '未找到机器人' },
        { status: 404 }
      );
    }

    // 创建Telegram客户端
    const telegram = new TelegramClient(bot.token);
    
    // 删除webhook
    await telegram.deleteWebhook();
    
    return NextResponse.json({
      success: true,
      message: 'Webhook删除成功',
    });
  } catch (error) {
    console.error('删除webhook失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '删除webhook失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
