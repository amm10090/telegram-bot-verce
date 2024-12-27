// src/components/settings/system-preferences.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useIntl } from "react-intl";
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
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useTheme } from "@contexts/ThemeContext";
import { useLocale } from "@contexts/LocaleContext";
import { useEffect } from "react";

const systemPreferencesSchema = z.object({
  theme: z.string({
    required_error: "请选择一个主题。",
  }),
  language: z.string({
    required_error: "请选择一个语言。",
  }),
});

type SystemPreferencesValues = z.infer<typeof systemPreferencesSchema>;

export default function SystemPreferences() {
  const intl = useIntl();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();

  // 将语言代码转换为表单所需的格式
  const convertLocaleToFormValue = (locale: string) => {
    return locale.startsWith('zh') ? 'zh' : 'en';
  };

  // 将表单语言值转换为实际的语言代码
  const convertFormValueToLocale = (value: string) => {
    return value === 'zh' ? 'zh-CN' : 'en-US';
  };

  const form = useForm<SystemPreferencesValues>({
    resolver: zodResolver(systemPreferencesSchema),
    defaultValues: {
      theme: theme,
      language: convertLocaleToFormValue(locale),
    },
  });

  // 当主题或语言变化时更新表单值
  useEffect(() => {
    form.setValue('theme', theme);
    form.setValue('language', convertLocaleToFormValue(locale));
  }, [theme, locale, form]);

  function onSubmit(data: SystemPreferencesValues) {
    try {
      setTheme(data.theme as 'light' | 'dark' | 'system');
      setLocale(convertFormValueToLocale(data.language));
      
      toast({
        description: intl.formatMessage({ id: "preferences.success.saved" }),
      });
    } catch (error) {
      toast({
        description: intl.formatMessage({ id: "preferences.error.failed" }),
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
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

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
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
        </div>

        <div className="pt-4 border-t">
          <Button type="submit">
            {intl.formatMessage({ id: "preferences.button.save" })}
          </Button>
        </div>
      </form>
    </Form>
  );
}