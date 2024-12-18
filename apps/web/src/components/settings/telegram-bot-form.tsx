// src/components/settings/telegram-bot-form.tsx

// 导入 React 和状态管理相关依赖
import React, { useState } from "react";
// 导入表单验证相关依赖
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// 导入国际化工具
import { useIntl } from 'react-intl';
// 导入自定义的 Telegram Bot 服务
import { createTelegramBotService } from '../services/telegram-bot-service';

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
import { useToast } from "../../hooks/use-toast";

/**
 * API 密钥的类型定义
 * 定义了 API 密钥对象的数据结构
 */
type ApiKey = {
  id: string;                    // 密钥的唯一标识符
  name: string;                  // Bot 的名称
  key: string;                   // API 密钥值
  createdAt: string;            // 创建时间
  type: 'telegram' | 'other';   // 密钥类型，可以是 telegram 或 other
};

/**
 * 组件的 Props 接口定义
 * 定义了组件接收的属性
 */
interface TelegramBotFormProps {
  // 初始数据，用于编辑模式
  initialData?: ApiKey | null;
  // 成功回调函数，当操作成功时调用
  onSuccess: (botData: ApiKey) => void;
}

/**
 * 使用 Zod 定义表单验证模式
 * 设置各字段的验证规则
 */
const telegramBotFormSchema = z.object({
  // Bot 名称验证规则
  botName: z.string()
    .min(2, { message: "Bot名称至少需要2个字符" })
    .max(50, { message: "Bot名称不能超过50个字符" }),
  
  // API 密钥验证规则
  apiKey: z.string()
    .min(1, { message: "API密钥不能为空" })
    .regex(/^\d+:[A-Za-z0-9_-]+$/, { message: "无效的API密钥格式" }),
  
  // 可选的描述字段
  description: z.string().optional(),
});

// 从验证模式中推断表单值的类型
type TelegramBotFormValues = z.infer<typeof telegramBotFormSchema>;

/**
 * Telegram Bot 表单组件
 * 用于创建或编辑 Telegram Bot 配置
 */
export function TelegramBotForm({ initialData, onSuccess }: TelegramBotFormProps) {
  // 使用必要的 hooks
  const intl = useIntl();                            // 国际化
  const { toast } = useToast();                      // 提示消息
  const [loading, setLoading] = useState(false);     // 加载状态

  // 设置表单的默认值
  const defaultValues: TelegramBotFormValues = {
    botName: initialData?.name || "",        // 如果是编辑模式，使用现有名称
    apiKey: initialData?.key || "",          // 如果是编辑模式，使用现有密钥
    description: "",                         // 描述默认为空
  };

  // 初始化表单，设置验证规则和默认值
  const form = useForm<TelegramBotFormValues>({
    resolver: zodResolver(telegramBotFormSchema),
    defaultValues,
  });

  /**
   * 处理表单提交
   * 包含完整的验证、保存和错误处理流程
   */
  async function onSubmit(data: TelegramBotFormValues) {
    // 设置加载状态
    setLoading(true);

    try {
      // 创建 Bot 服务实例
      const botService = createTelegramBotService(data.apiKey);

      // 验证 API 密钥
      const validationResult = await botService.validateApiKey();
      
      // 如果验证失败，显示错误信息并返回
      if (!validationResult.isValid) {
        toast({
          variant: "destructive",
          title: "验证失败",
          description: `${validationResult.error}。请检查：
            1. API密钥是否正确
            2. 网络连接是否正常
            3. Telegram API 服务是否可访问
            4. 是否遇到了超时问题`,
        });
        return;
      }

      // 尝试保存 API 密钥配置
      const saved = await botService.saveApiKey({
        token: data.apiKey,
        name: data.botName,
        enabled: true
      });

      // 如果保存成功
      if (saved) {
        // 创建新的 bot 数据对象
        const newBotData: ApiKey = {
          id: initialData?.id || String(Date.now()),  // 使用现有ID或生成新ID
          name: data.botName,
          key: data.apiKey,
          type: 'telegram',
          createdAt: initialData?.createdAt || new Date().toISOString().split('T')[0]
        };

        // 显示成功提示
        toast({
          title: initialData ? "更新成功" : "添加成功",
          description: `Bot ${validationResult.botInfo?.username || ''} 已成功${initialData ? '更新' : '添加'}！`,
        });
        
        // 重置表单
        form.reset();
        // 调用成功回调
        onSuccess(newBotData);
      } else {
        // 保存失败时显示错误提示
        toast({
          variant: "destructive",
          title: "保存失败",
          description: "无法保存API密钥配置，请稍后重试",
        });
      }
    } catch (error) {
      // 记录详细错误信息
      console.error('提交表单时发生错误:', error);
      // 显示用户友好的错误提示
      toast({
        variant: "destructive",
        title: "操作失败",
        description: "发生未知错误，请稍后重试",
      });
    } finally {
      // 无论成功与否，都要关闭加载状态
      setLoading(false);
    }
  }

  // 渲染表单
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Bot名称字段 */}
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

        {/* API密钥字段 */}
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
                />
              </FormControl>
              <FormDescription>
                从BotFather获取的API密钥
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 描述字段（可选） */}
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
          {/* 根据状态和模式显示不同的按钮文本 */}
          {loading ? '验证中...' : (initialData ? '更新' : '添加') + ' Telegram Bot'}
        </Button>
      </form>
    </Form>
  );
}