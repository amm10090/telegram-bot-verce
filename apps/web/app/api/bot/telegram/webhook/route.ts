/**
 * Telegram Bot Webhook 处理路由
 * 
 * 该文件处理来自 Telegram 的 webhook 请求，包括：
 * 1. 消息处理（普通消息和命令）
 * 2. 回调查询处理
 * 3. 自动回复功能
 * 
 * 安全性：
 * - 使用 x-telegram-bot-api-secret-token 头部进行身份验证
 * - secret token 使用 bot ID 作为验证令牌
 */

import { NextRequest, NextResponse } from 'next/server';
import BotModel from '@/models/bot';
import { connectDB } from '@/lib/db';
import { TelegramClient } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    console.log('收到 Telegram Webhook 请求');
    // 解析请求体，获取 Telegram 更新内容
    const update = await request.json();
    console.log('请求体内容:', JSON.stringify(update, null, 2));
    
    // 从更新内容中提取关键信息：
    // - chatId: 可能来自普通消息或回调查询
    // - messageText: 可能是消息文本或回调数据
    const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
    const messageText = update.message?.text || update.callback_query?.data;
    
    console.log('提取的信息:', {
      chatId,
      messageText,
      messageType: update.message ? 'message' : update.callback_query ? 'callback_query' : 'unknown'
    });
    
    // 验证必要的信息是否存在
    if (!chatId) {
      console.error('无法获取chat ID');
      return NextResponse.json({ success: true });  // 返回200，避免Telegram重试
    }

    // 连接数据库
    await connectDB();
    console.log('数据库连接成功');
    
    // 验证请求的合法性
    // secret token 应该与设置 webhook 时提供的 token 相匹配
    const authHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (!authHeader) {
      console.error('缺少认证token');
      return NextResponse.json({ success: true });
    }
    console.log('收到的 secret token:', authHeader);

    // 根据 secret token（bot ID）查找对应的机器人配置
    const bot = await BotModel.findById(authHeader);
    if (!bot) {
      console.error('找不到对应的机器人配置，secret token:', authHeader);
      return NextResponse.json({ success: true });
    }
    console.log('找到对应机器人:', { botId: bot.id, botName: bot.name });

    // 创建 Telegram 客户端实例用于发送响应
    const telegramBot = new TelegramClient(bot.token);

    // 处理命令消息（以 / 开头的消息）
    if (update.message?.text?.startsWith('/')) {
      // 规范化命令格式：移除多余的下划线，转换为小写
      const command = update.message.text.split(' ')[0].replace(/\/{2,}/g, '/').replace(/_{2,}/g, '_').toLowerCase();
      console.log('收到命令:', command);
      console.log('机器人菜单配置:', bot.menus);
      
      // 查找匹配的菜单命令
      const menuItem = bot.menus.find((menu) => {
        const normalizedMenuCommand = menu.command.replace(/\/{2,}/g, '/').replace(/_{2,}/g, '_').toLowerCase();
        console.log('比较命令:', {
          menuCommand: normalizedMenuCommand,
          receivedCommand: command,
          isMatch: normalizedMenuCommand === command,
        });
        return normalizedMenuCommand === command;
      });
      console.log('匹配的菜单项:', menuItem);
      
      // 如果找到匹配的命令并且有响应配置，发送响应
      if (menuItem?.response) {
        console.log('发送菜单响应');
        const response = menuItem.response;
        
        // 根据响应类型发送不同的消息
        if (response.types.includes('photo')) {
          await telegramBot.post('/sendPhoto', {
            chat_id: chatId,
            photo: response.mediaUrl,
            caption: response.caption || '',
            parse_mode: response.parseMode,
            reply_markup: response.buttons
          });
        } else if (response.types.includes('video')) {
          await telegramBot.post('/sendVideo', {
            chat_id: chatId,
            video: response.mediaUrl,
            caption: response.caption || '',
            parse_mode: response.parseMode,
            reply_markup: response.buttons
          });
        } else if (response.types.includes('document')) {
          await telegramBot.post('/sendDocument', {
            chat_id: chatId,
            document: response.mediaUrl,
            caption: response.caption || '',
            parse_mode: response.parseMode,
            reply_markup: response.buttons
          });
        } else {
          // 默认发送文本消息
          await telegramBot.sendMessage({
            chat_id: chatId,
            text: response.content,
            parse_mode: response.parseMode,
            reply_markup: response.buttons
          });
        }
        
        console.log('菜单响应发送成功');
        return NextResponse.json({ success: true });
      }
    }

    // 处理自动回复功能
    if (messageText && bot.autoReplies) {
      console.log('处理自动回复，消息内容:', messageText);
      // 遍历所有自动回复规则
      for (const rule of bot.autoReplies) {
        // 跳过未启用的规则
        if (!rule.isEnabled) {
          console.log('规则未启用，跳过:', rule);
          continue;
        }

        // 根据规则类型（关键词或正则）匹配消息
        const matches = rule.type === 'keyword'
          ? rule.triggers.some(trigger => messageText.includes(trigger))
          : rule.triggers.some(trigger => new RegExp(trigger).test(messageText));

        console.log('规则匹配结果:', {
          ruleType: rule.type,
          triggers: rule.triggers,
          matches
        });

        // 如果匹配成功且有响应配置，发送自动回复
        if (matches && rule.response) {
          console.log('发送自动回复');
          await telegramBot.sendMessage({
            chat_id: chatId,
            text: rule.response.content,
            parse_mode: rule.response.parseMode,
            reply_markup: rule.response.buttons
          });
          console.log('自动回复发送成功');
          return NextResponse.json({ success: true });
        }
      }
    }

    // 处理回调查询（例如按钮点击事件）
    if (update.callback_query) {
      console.log('处理回调查询:', update.callback_query);
      await telegramBot.post('/answerCallbackQuery', {
        callback_query_id: update.callback_query.id
      });
      console.log('回调查询处理成功');
      return NextResponse.json({ success: true });
    }

    // 如果没有匹配任何处理逻辑，仍然返回成功
    console.log('没有匹配的处理逻辑，返回成功');
    return NextResponse.json({ success: true });
  } catch (error) {
    // 错误处理：记录错误信息但仍返回成功响应
    // 这样做是为了避免 Telegram 重试失败的请求
    console.error('处理Telegram更新失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json({ success: true });  // 返回200，避免Telegram重试
  }
} 