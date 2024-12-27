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

interface TelegramBotFormProps {
  initialData?: BotResponse;
  onSuccess: (data: BotResponse) => void;
}

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
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      token: "",
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);
      
      // 验证 Token
      const validationResult = await telegramBotService.validateToken(data.token);
      if (!validationResult.success) {
        toast({
          variant: "destructive",
          title: intl.formatMessage({ id: "error.title" }),
          description: validationResult.message || intl.formatMessage({ id: "error.invalidToken" }),
        });
        return;
      }

      // 准备数据
      const botData: BotCreateInput | BotUpdateInput = {
        name: data.name,
        token: data.token,
      };

      // 创建或更新 Bot
      const result = initialData
        ? await telegramBotService.updateBot(initialData.id, botData as BotUpdateInput)
        : await telegramBotService.createBot(botData as BotCreateInput);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
