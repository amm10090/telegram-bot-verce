// src/components/settings/notification-preferences.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useIntl } from 'react-intl'
import React, { useState } from "react"
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
import { Card } from "@/components/ui/card"
import {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast" // 导入 useToast hook

// Zod 验证模式和类型定义保持不变...
const notificationsFormSchema = z.object({
  communication_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

// 表单默认值
const defaultValues: Partial<NotificationsFormValues> = {
  communication_emails: false,
  marketing_emails: false,
  social_emails: false,
  security_emails: true,
}

// NotificationOption 组件保持不变...
interface NotificationOptionProps {
  name: keyof NotificationsFormValues
  title: string
  description: string
  disabled?: boolean
  form: any
}

const NotificationOption: React.FC<NotificationOptionProps> = ({
  name,
  title,
  description,
  disabled = false,
  form
}) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-start sm:space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
        <FormControl className="mt-1">
          <Checkbox
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
            className="translate-y-1"
          />
        </FormControl>
        <div className="space-y-1 flex-1">
          <FormLabel className="text-base font-medium leading-none">
            {title}
          </FormLabel>
          <FormDescription className="text-sm text-muted-foreground">
            {description}
          </FormDescription>
        </div>
      </FormItem>
    )}
  />
)

export default function NotificationPreferences() {
  const intl = useIntl()
  const { toast } = useToast() // 使用 useToast hook
  
  // 初始化表单
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  })

  // 表单提交处理
  async function onSubmit(data: NotificationsFormValues) {
    try {
      // 这里添加实际的API调用逻辑
      console.log('提交的数据:', data)
      
      // 使用 toast 函数显示成功消息
      toast({
        variant: "default",
        title: intl.formatMessage({ id: 'notifications.success.title' }),
        description: intl.formatMessage({ id: 'notifications.success.description' }),
      })
    } catch (error) {
      // 显示错误消息
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: 'notifications.error.title' }),
        description: intl.formatMessage({ id: 'notifications.error.description' }),
      })
    }
  }

  return (
    <Card className="min-w-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            {/* 通讯邮件选项 */}
                        <div className="overflow-hidden">

            <NotificationOption
              form={form}
              name="communication_emails"
              title={intl.formatMessage({ id: 'notifications.communication.title' })}
              description={intl.formatMessage({ id: 'notifications.communication.description' })}
            />

            {/* 营销邮件选项 */}
            <NotificationOption
              form={form}
              name="marketing_emails"
              title={intl.formatMessage({ id: 'notifications.marketing.title' })}
              description={intl.formatMessage({ id: 'notifications.marketing.description' })}
            />

            {/* 社交通知选项 */}
            <NotificationOption
              form={form}
              name="social_emails"
              title={intl.formatMessage({ id: 'notifications.social.title' })}
              description={intl.formatMessage({ id: 'notifications.social.description' })}
            />

            {/* 安全邮件选项 - 不可禁用 */}
            <NotificationOption
              form={form}
              name="security_emails"
              title={intl.formatMessage({ id: 'notifications.security.title' })}
              description={intl.formatMessage({ id: 'notifications.security.description' })}
              disabled={true}
            />
          </div>
            </div>

          {/* 提交按钮 */}
          <div className="pt-4 border-t">
            <Button 
              type="submit"
              className="w-full sm:w-auto"
              disabled={!form.formState.isDirty}
            >
              {intl.formatMessage({ id: 'notifications.button.update' })}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}