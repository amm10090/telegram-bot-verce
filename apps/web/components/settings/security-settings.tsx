// src/components/settings/security-settings.tsx
// 安全设置组件：负责管理用户的安全相关配置，包括密码修改和双因素认证
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useIntl } from 'react-intl'
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { Toast } from "@workspace/ui/components/toast"
import React from "react"

// 定义安全设置表单的验证模式
// 使用 Zod 进行类型验证，确保数据的完整性和正确性
const securityFormSchema = z.object({
  // 当前密码：至少8个字符
  currentPassword: z.string().min(8, {
    message: "密码至少需要8个字符。",
  }),
  // 新密码：至少8个字符
  newPassword: z.string().min(8, {
    message: "密码至少需要8个字符。",
  }),
  // 确认密码：至少8个字符
  confirmPassword: z.string().min(8, {
    message: "密码至少需要8个字符。",
  }),
  // 双因素认证开关
  twoFactorAuth: z.boolean().default(false),
})
// 添加自定义验证：确保新密码和确认密码匹配
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不匹配",
  path: ["confirmPassword"], // 指定错误消息显示在确认密码字段
})

// 从验证模式推断表单值的类型
type SecurityFormValues = z.infer<typeof securityFormSchema>

// 设置表单的默认值
const defaultValues: Partial<SecurityFormValues> = {
  twoFactorAuth: false, // 默认关闭双因素认证
}

export  default function SecuritySettings() {
  // 使用 react-intl 的 hook 来支持国际化
  const intl = useIntl()

  // 初始化表单，配置验证器和默认值
  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues,
  })

  // Toast 相关状态管理
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // 显示通知的辅助函数
  const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // 表单提交处理函数
  function onSubmit(data: SecurityFormValues) {
    // 在实际应用中，这里会调用API来更新安全设置
    // 首先验证密码是否匹配
    if (data.newPassword !== data.confirmPassword) {
      showNotification(
        intl.formatMessage({ id: 'security.error.passwordMismatch' }),
        'error'
      )
      return
    }

    // 显示成功通知
    showNotification(
      intl.formatMessage({ id: 'security.success.updated' }),
      'success'
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 当前密码输入字段 */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: 'security.currentPassword.label' })}
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 新密码输入字段 */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: 'security.newPassword.label' })}
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 确认新密码输入字段 */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {intl.formatMessage({ id: 'security.confirmPassword.label' })}
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 双因素认证开关 */}
        <FormField
          control={form.control}
          name="twoFactorAuth"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {intl.formatMessage({ id: 'security.twoFactor.label' })}
                </FormLabel>
                <FormDescription>
                  {intl.formatMessage({ id: 'security.twoFactor.description' })}
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
          {intl.formatMessage({ id: 'security.button.update' })}
        </Button>

        {/* Toast 通知组件 */}
        <Toast 
          open={showToast} 
          onOpenChange={setShowToast}
          variant={toastType === 'error' ? 'destructive' : 'default'}
        >
          <div className={`
            p-4 rounded-md
            ${toastType === 'error' 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-primary text-primary-foreground'
            }
          `}>
            {toastMessage}
          </div>
        </Toast>
      </form>
    </Form>
  )
}