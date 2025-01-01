"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, Loader2 } from "lucide-react";
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

export const menuItemSchema = z.object({
  text: z.string().min(1, "请输入菜单文本"),
  command: z.string().min(1, "请输入命令").startsWith("/", "命令必须以/开头"),
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

const CommandPreview = ({ command, text }: { command: string; text: string }) => {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">命令预览</h4>
        <span className="text-xs text-muted-foreground">Telegram 显示效果</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-2 p-2 rounded bg-muted/50">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-blue-500">{command}</span>
              <span className="text-sm">-</span>
              <span className="text-sm">{text}</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>• 命令将显示在用户的命令菜单中</p>
          <p>• 用户可以通过输入 {command} 或点击命令来触发</p>
        </div>
      </div>
    </div>
  );
};

export function MenuForm({
  selectedItem,
  menuItems,
  onSubmit,
  saving
}: MenuFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [isTesting, setIsTesting] = useState(false);
  const [testReceiverId, setTestReceiverId] = useState("");
  const { toast } = useToast();
  const { selectedBot } = useBotContext();

  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      text: selectedItem.text,
      command: selectedItem.command,
      response: selectedItem.response || {
        types: [ResponseType.TEXT],
        content: ""
      }
    }
  });

  useEffect(() => {
      form.reset({
        text: selectedItem.text,
        command: selectedItem.command,
        response: selectedItem.response || {
          types: [ResponseType.TEXT],
          content: ""
        }
      });
  }, [selectedItem, form]);

  const validateCommand = (command: string) => {
    if (!command.startsWith('/')) {
      return "命令必须以/开头";
    }
    
    const isDuplicate = menuItems.some(item => 
      item.command === command && item.id !== selectedItem.id
    );
    
    if (isDuplicate) {
      return "该命令已存在";
    }
    
    return true;
  };

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
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-10 bg-background border-b">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="basic"
              className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              基本设置
            </TabsTrigger>
            <TabsTrigger
              value="response"
              className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              响应配置
            </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="basic" className="mt-0 border-0 p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>菜单文本</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                        <Input 
                          {...field} 
                          placeholder="/start"
                          className="pr-20"
                          onChange={(e) => {
                            field.onChange(e);
                            const validationResult = validateCommand(e.target.value);
                            if (typeof validationResult === "string") {
                              form.setError("command", { message: validationResult });
                            } else {
                              form.clearErrors("command");
                            }
                          }}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="text-xs text-muted-foreground">
                            {field.value && field.value.startsWith('/') ? '✓' : ''}
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <CommandPreview
                  command={form.watch("command")}
                  text={form.watch("text")}
                />
              </div>

              <Button 
                type="submit"
                disabled={saving}
                className="w-full"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存更改
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="response" className="mt-0 border-0">
          <div className="space-y-4">
          <MenuResponse
            response={form.watch("response") || {
              types: [ResponseType.TEXT],
              content: ""
            }}
            onChange={(response) => form.setValue("response", response)}
            onTest={handleTest}
            isTesting={isTesting}
              receiverId={testReceiverId}
              onReceiverIdChange={setTestReceiverId}
          />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 

MenuForm.schema = menuItemSchema; 