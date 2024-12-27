// src/components/settings/notification-preferences.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useIntl } from 'react-intl'
import React from "react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { useToast } from "@workspace/ui/hooks/use-toast"

const notificationsFormSchema = z.object({
  communication_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

const defaultValues: Partial<NotificationsFormValues> = {
  communication_emails: false,
  marketing_emails: false,
  social_emails: false,
  security_emails: true,
}

interface NotificationOptionProps {
  name: keyof NotificationsFormValues
  title: string
  description: string
  disabled?: boolean
  control: any
}

const NotificationOption: React.FC<NotificationOptionProps> = ({
  name,
  title,
  description,
  disabled = false,
  control
}) => (
  <FormField
    control={control}
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
  const { toast } = useToast()
  
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  })

  async function onSubmit(data: NotificationsFormValues) {
    try {
      console.log('提交的数据:', data)
      toast({
        variant: "default",
        title: intl.formatMessage({ id: 'notifications.success.title' }),
        description: intl.formatMessage({ id: 'notifications.success.description' }),
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: 'notifications.error.title' }),
        description: intl.formatMessage({ id: 'notifications.error.description' }),
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3">
          <div className="overflow-hidden">
            <NotificationOption
              control={form.control}
              name="communication_emails"
              title={intl.formatMessage({ id: 'notifications.communication.title' })}
              description={intl.formatMessage({ id: 'notifications.communication.description' })}
            />

            <NotificationOption
              control={form.control}
              name="marketing_emails"
              title={intl.formatMessage({ id: 'notifications.marketing.title' })}
              description={intl.formatMessage({ id: 'notifications.marketing.description' })}
            />

            <NotificationOption
              control={form.control}
              name="social_emails"
              title={intl.formatMessage({ id: 'notifications.social.title' })}
              description={intl.formatMessage({ id: 'notifications.social.description' })}
            />

            <NotificationOption
              control={form.control}
              name="security_emails"
              title={intl.formatMessage({ id: 'notifications.security.title' })}
              description={intl.formatMessage({ id: 'notifications.security.description' })}
              disabled={true}
            />
          </div>
        </div>

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
  );
}