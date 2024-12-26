// src/components/settings/user-profile.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useIntl } from "react-intl";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Toast } from "@workspace/ui/components/toast";
import React from "react";

// 定义表单验证模式
// 我们使用 Zod 来确保数据的完整性和正确性
const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "用户名至少需要2个字符。",
  }),
  email: z.string().email({
    message: "请输入有效的邮箱地址。",
  }),
  bio: z
    .string()
    .min(4, {
      message: "简介至少需要4个字符。",
    })
    .max(160, {
      message: "简介不能超过160个字符。",
    }),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: "请输入有效的URL。" }),
      })
    )
    .optional(),
});

// 从验证模式推��表单值的类型
type ProfileFormValues = z.infer<typeof profileFormSchema>;

// 设置表单的默认值
const defaultValues: Partial<ProfileFormValues> = {
  bio: "我是一名Telegram机器人开发者。",
  urls: [
    { value: "https://example.com" },
    { value: "https://twitter.com/username" },
  ],
};

export default function UserProfile() {
  const intl = useIntl();

  // 表单初始化设置
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // 添加 Toast 状态管理
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // 添加显示通知的辅助函数
  const showNotification = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // 修改表单提交处理函数
  function onSubmit(data: ProfileFormValues) {
    // 表单验证成功后的处理逻辑
    try {
      // 这里可以添加API调用来保存用户资料
      showNotification(
        intl.formatMessage({ id: "profile.success.saved" }),
        "success"
      );
    } catch (error) {
      showNotification(
        intl.formatMessage({ id: "profile.error.failed" }),
        "error"
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 用户名输入字段 */}
        <FormField
          control={form.control}
          name="username"
          render={({
            field,
          }: {
            field: {
              name: string;
              value: string;
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
            };
          }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: "profile.username.label" })}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={intl.formatMessage({
                    id: "profile.username.placeholder",
                  })}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {intl.formatMessage({ id: "profile.username.description" })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 邮箱输入字段 */}
        <FormField
          control={form.control}
          name="email"
          render={({
            field,
          }: {
            field: {
              name: string;
              value: string;
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
            };
          }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: "profile.email.label" })}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={intl.formatMessage({
                    id: "profile.email.placeholder",
                  })}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {intl.formatMessage({ id: "profile.email.description" })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 个人简介输入区域 */}
        <FormField
          control={form.control}
          name="bio"
          render={({
            field,
          }: {
            field: {
              name: string;
              value: string;
              onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
            };
          }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: "profile.bio.label" })}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={intl.formatMessage({
                    id: "profile.bio.placeholder",
                  })}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {intl.formatMessage({ id: "profile.bio.description" })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 提交按钮 */}
        <Button type="submit">
          {intl.formatMessage({ id: "profile.button.update" })}
        </Button>

        {/* 添加 Toast 通知组件 */}
        <Toast
          open={showToast}
          onOpenChange={setShowToast}
          variant={toastType === "error" ? "destructive" : "default"}
        >
          <div
            className={`
            p-4 rounded-md
            ${
              toastType === "error"
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }
          `}
          >
            {toastMessage}
          </div>
        </Toast>
      </form>
    </Form>
  );
}
