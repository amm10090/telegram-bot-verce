"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useIntl } from "react-intl";
import { telegramBotService } from "@/components/services/telegram-bot-service";
import type { BotResponse, BotCreateInput, BotUpdateInput } from "@/types/bot";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { useToast } from "@workspace/ui/hooks/use-toast";

// Telegram Bot 表单组件，用于创建或更新 Telegram Bot
// 支持客户端渲染，包含表单验证和提交逻辑
interface TelegramBotFormProps {
  initialData?: BotResponse;
  onSuccess: (data: BotResponse) => void;
}

// 表单验证模式定义
// 使用 zod 进行表单字段验证，包括 name 和 token 的格式要求
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Bot名称至少需要2个字符" })
    .max(50, { message: "Bot名称不能超过50个字符" })
    .trim(),
  token: z
    .string()
    .min(1, { message: "Token不能为空" })
    .regex(/^\d+:[A-Za-z0-9_-]+$/, { message: "无效的Token格式" })
    .trim(),
});

type FormValues = z.infer<typeof formSchema>;

export function TelegramBotForm({ initialData, onSuccess }: TelegramBotFormProps) {
  const intl = useIntl();
  const { toast } = useToast();
  // 控制表单提交状态
  const [loading, setLoading] = useState(false);

  // 初始化表单，设置默认值和验证规则
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      token: "",
    },
  });

  // 表单提交处理函数
  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);
      
      // 首先验证 Token 的有效性
      const validationResult = await telegramBotService.validateToken(data.token);
      if (!validationResult.success) {
        toast({
          variant: "destructive",
          title: intl.formatMessage({ id: "error.title" }),
          description: validationResult.message || intl.formatMessage({ id: "error.invalidToken" }),
        });
        return;
      }

      // 准备要提交的数据
      const botData: BotCreateInput | BotUpdateInput = {
        name: data.name,
        token: data.token,
      };

      // 根据是否有初始数据决定是创建还是更新操作
      const result = initialData
        ? await telegramBotService.updateBot(initialData.id, botData as BotUpdateInput)
        : await telegramBotService.createBot(botData as BotCreateInput);

      // 处理操作结果
      if (result.success) {
        toast({
          description: intl.formatMessage({
            id: initialData ? "bot.updated" : "bot.created",
          }),
        });
        form.reset();
        onSuccess(result.data);
      } else {
        toast({
          variant: "destructive",
          title: intl.formatMessage({ id: "error.title" }),
          description: result.message || intl.formatMessage({ id: "error.unknown" }),
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "error.title" }),
        description: error instanceof Error
          ? error.message
          : intl.formatMessage({ id: "error.unknown" }),
      });
    } finally {
      setLoading(false);
    }
  }

  // 渲染表单界面
  // 包含 name 和 token 两个输入字段，以及提交按钮
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Bot 名称输入字段 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{intl.formatMessage({ id: "bot.form.name" })}</FormLabel>
              <FormControl>
                <Input
                  placeholder={intl.formatMessage({ id: "bot.form.namePlaceholder" })}
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {intl.formatMessage({ id: "bot.form.nameDescription" })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bot Token 输入字段 */}
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{intl.formatMessage({ id: "bot.form.token" })}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={intl.formatMessage({ id: "bot.form.tokenPlaceholder" })}
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {intl.formatMessage({ id: "bot.form.tokenDescription" })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 提交按钮 */}
        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? intl.formatMessage({ id: "common.processing" })
            : intl.formatMessage({
                id: initialData ? "common.update" : "common.create",
              })}
        </Button>
      </form>
    </Form>
  );
}
