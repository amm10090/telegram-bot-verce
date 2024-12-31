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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { MenuItem } from './menu-item';

// 定义表单验证模式
export const menuItemSchema = z.object({
  text: z.string().min(1, "菜单文本不能为空"),
  command: z.string()
    .min(1, "命令不能为空")
    .regex(/^\/[a-zA-Z0-9_]+$/, "命令必须以/开头，且只能包含字母、数字和下划线")
    .refine(
      (command) => !command.includes("//"),
      "命令不能包含连续的斜杠"
    ),
  url: z.string().url("请输入有效的URL").optional().or(z.literal('')),
});

interface MenuFormProps {
  selectedItem: MenuItem | null;
  menuItems: MenuItem[];
  onSubmit: (values: z.infer<typeof menuItemSchema>) => Promise<void>;
  saving: boolean;
}

// 命令预览组件
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

export function MenuForm({ selectedItem, menuItems, onSubmit, saving }: MenuFormProps) {
  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      text: selectedItem?.text || "",
      command: selectedItem?.command || "",
      url: selectedItem?.url || "",
    },
  });

  // 命令重复检查
  const validateCommand = (command: string, currentItemId?: string) => {
    if (!command.startsWith('/')) {
      return "命令必须以/开头";
    }
    
    const isDuplicate = menuItems.some(item => 
      item.command === command && item.id !== currentItemId
    );
    
    if (isDuplicate) {
      return "该命令已存在";
    }
    
    return true;
  };

  return (
    <div className="space-y-4">
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
                        const validationResult = validateCommand(e.target.value, selectedItem?.id);
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

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex w-full justify-between p-2 hover:bg-muted/50">
                <span className="text-sm font-medium">高级选项</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-1 pb-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" />
                    </FormControl>
                    <FormDescription>
                      可选：点击菜单项时打开的链接
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

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
    </div>
  );
} 