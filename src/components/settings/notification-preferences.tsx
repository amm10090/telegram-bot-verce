// src/components/settings/notification-preferences.tsx
// 通知首选项组件，管理用户的通知设置
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useIntl } from 'react-intl';
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Toast } from "@/components/ui/toast"  // 导入 Toast 组件
import React, { useState } from "react";

// 使用 Zod 定义表单的验证模式
const notificationsFormSchema = z.object({
  // 每个字段都是布尔值，代表不同类型的通知开关
  communication_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(), // 安全邮件是必需的，不能关闭
})

// 从验证模式中推断出表单的 TypeScript 类型
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

// 设置表单的默认值
const defaultValues: Partial<NotificationsFormValues> = {
  communication_emails: false,
  marketing_emails: false,
  social_emails: false,
  security_emails: true, // 安全邮件默认开启
}

export default  function NotificationPreferences() {
  const intl = useIntl();
  // 使用 react-hook-form 初始化表单
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  })
  const [showToast, setShowToast] = useState(false)          // 控制toast的显示和隐藏
  const [toastMessage, setToastMessage] = useState("")       // toast消息内容
  const [toastType, setToastType] = useState<'success' | 'error'>('success')  // toast类型
    const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }
  // 表单提交处理函数
  function onSubmit(data: NotificationsFormValues) {
    // 处理表单提交
    showNotification(
      intl.formatMessage({ id: 'notifications.success.title' }),
      'success'
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 通信邮件设置 */}
        <FormField
          control={form.control}
          name="communication_emails"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {intl.formatMessage({ id: 'notifications.communication.title' })}
                </FormLabel>
                <FormDescription>
                  {intl.formatMessage({ id: 'notifications.communication.description' })}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* 营销邮件设置 */}
        <FormField
          control={form.control}
          name="marketing_emails"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {intl.formatMessage({ id: 'notifications.marketing.title' })}
                </FormLabel>
                <FormDescription>
                  {intl.formatMessage({ id: 'notifications.marketing.description' })}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* 社交邮件设置 */}
        <FormField
          control={form.control}
          name="social_emails"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {intl.formatMessage({ id: 'notifications.social.title' })}
                </FormLabel>
                <FormDescription>
                  {intl.formatMessage({ id: 'notifications.social.description' })}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* 安全邮件设置（不可禁用） */}
        <FormField
          control={form.control}
          name="security_emails"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {intl.formatMessage({ id: 'notifications.security.title' })}
                </FormLabel>
                <FormDescription>
                  {intl.formatMessage({ id: 'notifications.security.description' })}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* 提交按钮 */}
        <Button type="submit">
          {intl.formatMessage({ id: 'notifications.button.update' })}
        </Button>
      </form>
    </Form>
  )
}