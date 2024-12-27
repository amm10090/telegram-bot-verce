// src/components/settings/security-settings.tsx
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

const securityFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "密码至少需要8个字符。",
  }),
  newPassword: z.string().min(8, {
    message: "密码至少需要8个字符。",
  }),
  confirmPassword: z.string().min(8, {
    message: "密码至少需要8个字符。",
  }),
  twoFactorAuth: z.boolean().default(false),
})
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不匹配",
  path: ["confirmPassword"],
})

type SecurityFormValues = z.infer<typeof securityFormSchema>

const defaultValues: Partial<SecurityFormValues> = {
  twoFactorAuth: false,
}

export default function SecuritySettings() {
  const intl = useIntl()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues,
  })

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const onSubmit = (data: SecurityFormValues) => {
    if (data.newPassword !== data.confirmPassword) {
      showNotification(
        intl.formatMessage({ id: 'security.error.passwordMismatch' }),
        'error'
      )
      return
    }

    showNotification(
      intl.formatMessage({ id: 'security.success.updated' }),
      'success'
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

        <Button type="submit">
          {intl.formatMessage({ id: 'security.button.update' })}
        </Button>
      </form>

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
    </Form>
  )
}