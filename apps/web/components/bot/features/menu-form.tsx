/**
 * 菜单表单组件
 * 
 * 该组件提供了一个完整的菜单项编辑界面，包括：
 * - 基本信息设置（菜单文本和命令）
 * - 响应配置（机器人回复的内容和行为）
 * - 实时预览
 * - 表单验证
 * - 测试功能
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, Loader2, Command, Link, MessageSquare } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { MenuResponse } from './menu-response';
import { ResponseType } from '@/types/bot';
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import { useToast } from "@workspace/ui/hooks/use-toast";
import type { MenuItem } from "./menu-item";
import { useBotContext } from "@/contexts/BotContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@/lib/utils";

/**
 * 检查命令格式是否有效
 */
function isValidCommand(command: string): boolean {
  return /^\/[a-z0-9_]{1,31}$/.test(command);
}

/**
 * 菜单项数据验证模式
 * 使用 zod 定义表单字段的验证规则
 */
export const menuItemSchema = z.object({
  text: z.string().min(1, "请输入菜单文本"),
  command: z.string()
    .min(1, "请输入命令")
    .startsWith("/", "命令必须以/开头")
    .regex(/^\/[a-z0-9_]+$/i, "命令只能包含字母、数字和下划线")
    .transform(val => val.toLowerCase())  // 自动转换为小写
    .refine(val => val.length <= 32, "命令长度不能超过32个字符"),
  response: z.object({
    types: z.array(z.nativeEnum(ResponseType)),
    content: z.string(),
    buttons: z.object({
      buttons: z.array(z.array(z.object({
        text: z.string(),
        type: z.enum(["url", "callback"]),
        value: z.string()
      })))
    }).optional(),
    parseMode: z.enum(["HTML", "Markdown"]).optional(),
    mediaUrl: z.string().optional(),
    caption: z.string().optional(),
    inputPlaceholder: z.string().optional(),
    resizeKeyboard: z.boolean().optional(),
    oneTimeKeyboard: z.boolean().optional(),
    selective: z.boolean().optional()
  }).optional()
});

export interface MenuFormProps {
  selectedItem: MenuItem;
  menuItems: MenuItem[];
  onSubmit: (values: z.infer<typeof menuItemSchema>) => Promise<void>;
  saving: boolean;
}

/**
 * 命令预览组件
 * 展示命令在 Telegram 中的实际显示效果
 */
const CommandPreview = ({ command, text }: { command: string; text: string }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">命令预览</CardTitle>
          <Badge variant="secondary">Telegram 显示效果</Badge>
        </div>
        <CardDescription>
          用户将在 Telegram 中看到的命令展示效果
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Command className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-blue-500">{command}</code>
              <span className="text-sm text-muted-foreground">-</span>
              <span className="text-sm">{text}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>命令将显示在用户的命令菜单中</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link className="h-4 w-4" />
            <span>用户可以通过输入 {command} 或点击命令来触发</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 验证命令的格式和唯一性
 */
function validateCommand(command: string, menuItems: MenuItem[], currentId?: string): true | string {
  // 验证命令格式
  if (!command) return '命令不能为空';
  if (!/^\/[a-z0-9_]{1,31}$/.test(command)) {
    return '命令格式无效';
  }
  
  // 验证命令唯一性
  const isDuplicate = menuItems.some(item => 
    item.command.toLowerCase() === command.toLowerCase() && 
    item.id !== currentId
  );
  
  if (isDuplicate) {
    return '该命令已存在';
  }
  
  return true;
}

export function MenuForm({
  selectedItem,
  menuItems,
  onSubmit,
  saving
}: MenuFormProps) {
  // 状态管理
  const [activeTab, setActiveTab] = useState("basic");
  const [isTesting, setIsTesting] = useState(false);
  const [testReceiverId, setTestReceiverId] = useState("");
  const { toast } = useToast();
  const { selectedBot } = useBotContext();

  /**
   * 表单实例
   * 使用 react-hook-form 管理表单状态和验证
   */
  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      text: selectedItem.text,
      command: selectedItem.command,
      response: {
        types: selectedItem.response?.types || [ResponseType.TEXT],
        content: selectedItem.response?.content || "",
        buttons: selectedItem.response?.buttons,
        parseMode: selectedItem.response?.parseMode,
        mediaUrl: selectedItem.response?.mediaUrl,
        caption: selectedItem.response?.caption,
        inputPlaceholder: selectedItem.response?.inputPlaceholder,
        resizeKeyboard: selectedItem.response?.resizeKeyboard,
        oneTimeKeyboard: selectedItem.response?.oneTimeKeyboard,
        selective: selectedItem.response?.selective
      }
    }
  });

  /**
   * 当选中的菜单项变更时，重置表单数据
   */
  useEffect(() => {
    if (selectedItem) {
      form.reset({
        text: selectedItem.text,
        command: selectedItem.command,
        response: {
          types: selectedItem.response?.types || [ResponseType.TEXT],
          content: selectedItem.response?.content || "",
          buttons: selectedItem.response?.buttons,
          parseMode: selectedItem.response?.parseMode,
          mediaUrl: selectedItem.response?.mediaUrl,
          caption: selectedItem.response?.caption,
          inputPlaceholder: selectedItem.response?.inputPlaceholder,
          resizeKeyboard: selectedItem.response?.resizeKeyboard,
          oneTimeKeyboard: selectedItem.response?.oneTimeKeyboard,
          selective: selectedItem.response?.selective
        }
      }, {
        keepDefaultValues: true
      });
    }
  }, [selectedItem, form]);

  /**
   * 测试命令响应
   * 向指定的接收者发送测试消息
   */
  const handleTest = async () => {
    if (!testReceiverId) {
      toast({
        title: "错误",
        description: "请输入接收者ID",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBot?.token) {
      toast({
        title: "错误",
        description: "未找到机器人Token",
        variant: "destructive",
      });
      return;
    }

    const formValues = form.getValues();
    const response = formValues.response;

    // 验证响应内容
    if (!response?.types?.length) {
      toast({
        title: "错误",
        description: "请选择至少一种响应类型",
        variant: "destructive",
      });
      return;
    }

    if (!response.content?.trim()) {
      toast({
        title: "错误",
        description: "请输入响应内容",
        variant: "destructive",
      });
      return;
    }

    // 验证媒体类型的URL
    if (
      (response.types.includes(ResponseType.PHOTO) ||
        response.types.includes(ResponseType.VIDEO) ||
        response.types.includes(ResponseType.DOCUMENT)) &&
      !response.mediaUrl
    ) {
      toast({
        title: "错误",
        description: "请输入媒体文件URL",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/command/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bot ${selectedBot.token}`
        },
        body: JSON.stringify({
          command: formValues.command,
          response: formValues.response,
          receiverId: testReceiverId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '测试失败');
      }

      const result = await response.json();
      toast({
        title: "测试成功",
        description: result.message || "命令响应已发送到 Telegram",
      });
    } catch (error: any) {
      toast({
        title: "测试失败",
        description: error.message || "请检查命令配置是否正确",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* 选项卡导航 */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            {/* 基本设置选项卡 */}
            <TabsTrigger
              value="basic"
              className={cn(
                "relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium",
                "text-muted-foreground hover:text-foreground",
                "data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              )}
            >
              <div className="flex items-center gap-2">
                <Command className="h-4 w-4" />
                基本设置
              </div>
            </TabsTrigger>
            {/* 响应配置选项卡 */}
            <TabsTrigger
              value="response"
              className={cn(
                "relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium",
                "text-muted-foreground hover:text-foreground",
                "data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                响应配置
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 基本设置表单 */}
        <TabsContent value="basic" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* 基本信息卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">基本信息</CardTitle>
                  <CardDescription>
                    设置菜单项的显示文本和触发命令
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>菜单文本</FormLabel>
                        <FormControl>
                          <Input {...field} className="font-medium" />
                        </FormControl>
                        <FormDescription>
                          在命令列表中显示的文本说明
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="command"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>命令</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">/</div>
                            <Input 
                              {...field} 
                              value={field.value.replace(/^\//, '')}
                              className="font-mono pl-7 pr-20"
                              onChange={(e) => {
                                // 自动转换为小写并移除非法字符
                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                // 限制长度（不含/）
                                const trimmedValue = value.slice(0, 31);
                                field.onChange(`/${trimmedValue}`);
                                
                                // 验证命令
                                const validationResult = validateCommand(`/${trimmedValue}`, menuItems, selectedItem.id);
                                if (typeof validationResult === "string") {
                                  form.setError("command", { message: validationResult });
                                } else {
                                  form.clearErrors("command");
                                }
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedText = e.clipboardData.getData('text');
                                // 移除可能存在的/前缀，并应用相同的格式规则
                                const cleanedText = pastedText.replace(/^\//, '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 31);
                                field.onChange(`/${cleanedText}`);
                              }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Badge 
                                variant={isValidCommand(field.value) ? "default" : "secondary"}
                                className="font-normal"
                              >
                                {isValidCommand(field.value) ? '有效' : '无效'}
                              </Badge>
                            </div>
                          </div>
                        </FormControl>
                        <div className="text-[0.8rem] text-muted-foreground space-y-1">
                          <div>用于触发此菜单项的命令，必须符合以下规则：</div>
                          <ul className="text-xs list-disc list-inside space-y-1">
                            <li>只能包含小写字母、数字和下划线</li>
                            <li>长度不超过32个字符（含/）</li>
                          </ul>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 命令预览 */}
              <CommandPreview
                command={form.watch("command")}
                text={form.watch("text")}
              />

              {/* 表单操作按钮 */}
              <div className="flex items-center gap-4">
                <Button 
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  保存更改
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={saving}
                >
                  重置
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* 响应配置表单 */}
        <TabsContent value="response" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">响应配置</CardTitle>
              <CardDescription>
                设置当用户触发此命令时，机器人的响应行为
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MenuResponse
                response={form.watch("response") || {
                  types: [ResponseType.TEXT],
                  content: ""
                }}
                onChange={(response) => {
                  form.setValue("response", response, { 
                    shouldValidate: true,
                    shouldDirty: true 
                  });
                }}
                onTest={handleTest}
                isTesting={isTesting}
                receiverId={testReceiverId}
                onReceiverIdChange={setTestReceiverId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

MenuForm.schema = menuItemSchema; 