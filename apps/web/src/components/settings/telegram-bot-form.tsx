// src/components/settings/telegram-bot-form.tsx

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useIntl } from 'react-intl';
// 导入新的服务实例和类型
import { telegramBotService } from '../services/telegram-bot-service';
import type { Bot, BotInfo, ApiResponse } from '../../types/bot';

// 导入 UI 组件
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * 组件的 Props 接口定义
 * 现在使用新的 Bot 类型替换原来的 ApiKey 类型
 */
interface TelegramBotFormProps {
  initialData?: Bot | null;           // 使用新的 Bot 类型
  onSuccess: (botData: Bot) => void;  // 回调函数也使用新的 Bot 类型
}

/**
 * 表单验证模式
 * 使用 Zod 定义严格的验证规则
 */
const telegramBotFormSchema = z.object({
  // Bot 名称验证规则
  botName: z.string()
    .min(2, { message: "Bot名称至少需要2个字符" })
    .max(50, { message: "Bot名称不能超过50个字符" })
    .trim(),
  
  // API 密钥验证规则
  apiKey: z.string()
    .min(1, { message: "API密钥不能为空" })
    .regex(/^\d+:[A-Za-z0-9_-]+$/, { message: "无效的API密钥格式" })
    .trim(),
  
  // 描述字段（可选）
  description: z.string().optional(),
});

// 从验证模式推断表单值类型
type TelegramBotFormValues = z.infer<typeof telegramBotFormSchema>;

/**
 * Telegram Bot 表单组件
 * 用于创建或编辑 Bot 配置
 */
export function TelegramBotForm({ initialData, onSuccess }: TelegramBotFormProps) {
  const intl = useIntl();                        // 国际化工具
  const { toast } = useToast();                  // 提示消息工具
  const [loading, setLoading] = useState(false); // 加载状态管理

  // 设置表单的默认值
  const defaultValues: TelegramBotFormValues = {
    botName: initialData?.name || "",     // 如果是编辑模式，使用现有名称
    apiKey: initialData?.apiKey || "",    // 使用 apiKey 而不是 key
    description: "",                      // 描述默认为空
  };

  // 初始化表单
  const form = useForm<TelegramBotFormValues>({
    resolver: zodResolver(telegramBotFormSchema),
    defaultValues,
  });

  /**
   * 处理表单提交
   * 使用新的服务方法处理数据
   */
  async function onSubmit(data: TelegramBotFormValues) {
    setLoading(true);

    try {
      // 首先验证 Token
      const validationResult = await telegramBotService.validateToken(data.apiKey);
      
      if (!validationResult.success) {
        toast({
          variant: "destructive",
          title: "验证失败",
          description: validationResult.message || "Token验证失败，请检查输入是否正确",
        });
        return;
      }

      // 准备要保存的数据
      const botData = {
        name: data.botName,
        apiKey: data.apiKey,
        isEnabled: true,
      };

      // 根据是否有初始数据决定是创建还是更新
      const result = initialData
        ? await telegramBotService.updateBot(initialData.id, botData)
        : await telegramBotService.createBot(botData);

      if (result.success && result.data) {
        // 显示成功提示
        toast({
          title: initialData ? "更新成功" : "添加成功",
          description: `Bot ${data.botName} 已成功${initialData ? '更新' : '添加'}！`,
        });
        
        // 重置表单并调用成功回调
        form.reset();
        onSuccess(result.data);
      } else {
        // 显示错误提示
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.message || "操作失败，请稍后重试",
        });
      }
    } catch (error) {
      // 错误处理
      console.error('表单提交错误:', error);
      toast({
        variant: "destructive",
        title: "操作失败",
        description: error instanceof Error ? error.message : "发生未知错误",
      });
    } finally {
      setLoading(false);
    }
  }

  // 渲染表单界面
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Bot名称输入字段 */}
        <FormField
          control={form.control}
          name="botName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bot名称</FormLabel>
              <FormControl>
                <Input 
                  placeholder="输入Bot名称" 
                  {...field} 
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                这将显示在您的Bot列表中
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* API密钥输入字段 */}
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API密钥</FormLabel>
              <FormControl>
                <Input 
                  placeholder="输入Telegram Bot API密钥" 
                  {...field}
                  disabled={loading}
                  type="password"  // 添加密码类型，提高安全性
                />
              </FormControl>
              <FormDescription>
                从BotFather获取的API密钥
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 描述输入字段（可选） */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述（可选）</FormLabel>
              <FormControl>
                <Input 
                  placeholder="输入Bot描述" 
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                为您的Bot添加简短描述
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 提交按钮 */}
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? '处理中...' : (initialData ? '更新' : '添加') + ' Telegram Bot'}
        </Button>
      </form>
    </Form>
  );
}