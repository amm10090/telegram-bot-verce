// src/components/settings/system-preferences.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useIntl } from "react-intl";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { useToast } from "@workspace/ui/hooks/use-toast";
import React from "react";

// 使用Zod定义系统设置的验证模式
// 这个schema定义了表单中每个字段的类型和验证规则
const systemPreferencesSchema = z.object({
  // 主题设置：必须选择一个主题
  theme: z.string({
    required_error: "请选择一个主题。",
  }),
  // 语言设置：必须选择一个语言
  language: z.string({
    required_error: "请选择一���语言。",
  }),
  // 自动更新开关：默认开启
  autoUpdate: z.boolean().default(true),
  // 测试功能开关：默认关闭
  betaFeatures: z.boolean().default(false),
});

// 从验证模式推断出表单值的TypeScript类型
type SystemPreferencesValues = z.infer<typeof systemPreferencesSchema>;

// 设置表单的默认值
const defaultValues: Partial<SystemPreferencesValues> = {
  theme: "system", // 默认使用系统主题
  language: "en", // 默认使用英语
  autoUpdate: true, // 默认开启自动更新
  betaFeatures: false, // 默认关闭测试功能
};

export default function SystemPreferences() {
  // 使用react-intl的hook来支持国际化
  const intl = useIntl();
  const { toast } = useToast();

  // 初始化表单，配置验证器和默认值
  const form = useForm<SystemPreferencesValues>({
    resolver: zodResolver(systemPreferencesSchema),
    defaultValues,
  });

  // 显示通知的辅助函数
  const showNotification = (message: string, type: "success" | "error") => {
    toast({
      variant: type === "error" ? "destructive" : "default",
      description: message,
    });
  };

  // 表单提交处理函数
  function onSubmit(data: SystemPreferencesValues) {
    // 在实际应用中，这里会调用API来保存系统设置
    showNotification(
      intl.formatMessage({ id: "preferences.success.saved" }),
      "success"
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 主题选择字段 */}
        <FormField
          control={form.control}
          name="theme"
          render={({
            field,
          }: {
            field: {
              name: string;
              value: string;
              onChange: (value: string) => void;
            };
          }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: "preferences.theme.label" })}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={intl.formatMessage({
                        id: "preferences.theme.placeholder",
                      })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="light">
                    {intl.formatMessage({ id: "preferences.theme.light" })}
                  </SelectItem>
                  <SelectItem value="dark">
                    {intl.formatMessage({ id: "preferences.theme.dark" })}
                  </SelectItem>
                  <SelectItem value="system">
                    {intl.formatMessage({ id: "preferences.theme.system" })}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {intl.formatMessage({ id: "preferences.theme.description" })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 语言选择字段 */}
        <FormField
          control={form.control}
          name="language"
          render={({
            field,
          }: {
            field: {
              name: string;
              value: string;
              onChange: (value: string) => void;
            };
          }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: "preferences.language.label" })}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={intl.formatMessage({
                        id: "preferences.language.placeholder",
                      })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">
                    {intl.formatMessage({ id: "preferences.language.english" })}
                  </SelectItem>
                  <SelectItem value="zh">
                    {intl.formatMessage({ id: "preferences.language.chinese" })}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {intl.formatMessage({ id: "preferences.language.description" })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 自动更新开关 */}
        <FormField
          control={form.control}
          name="autoUpdate"
          render={({
            field,
          }: {
            field: {
              name: string;
              value: boolean;
              onChange: (value: boolean) => void;
            };
          }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {intl.formatMessage({ id: "preferences.autoUpdate.label" })}
                </FormLabel>
                <FormDescription>
                  {intl.formatMessage({
                    id: "preferences.autoUpdate.description",
                  })}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Beta功能开关 */}
        <FormField
          control={form.control}
          name="betaFeatures"
          render={({
            field,
          }: {
            field: {
              name: string;
              value: boolean;
              onChange: (value: boolean) => void;
            };
          }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {intl.formatMessage({ id: "preferences.betaFeatures.label" })}
                </FormLabel>
                <FormDescription>
                  {intl.formatMessage({
                    id: "preferences.betaFeatures.description",
                  })}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 提交按钮 */}
        <Button type="submit">
          {intl.formatMessage({ id: "preferences.button.save" })}
        </Button>
      </form>
    </Form>
  );
}
