"use client";

import { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Trash, GripVertical, ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Undo2, Redo2, Keyboard } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
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
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { telegramMenuService } from '@/components/services/telegram-menu-service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

// 定义菜单项的类型
interface MenuItem {
  id: string;
  text: string;
  command: string;
  url?: string;
  order: number;
  children?: MenuItem[];
}

// 定义表单验证模式
const menuItemSchema = z.object({
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

// 添加加载和操作状态组件
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">正在处理...</span>
    </div>
  </div>
);

const OperationFeedback = ({ type, message }: { type: 'success' | 'error'; message: string }) => (
  <div className={cn(
    "absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg",
    "flex items-center gap-2 text-sm transition-all duration-200",
    type === 'success' ? "bg-success/90 text-success-foreground" : "bg-destructive/90 text-destructive-foreground"
  )}>
    {type === 'success' ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4" />
    )}
    {message}
  </div>
);

export function MenuSettings({ botId, isOpen, onClose }: { 
  botId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const intl = useIntl();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [operationFeedback, setOperationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [history, setHistory] = useState<MenuItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      text: "",
      command: "",
      url: "",
    },
  });

  // 使用 React Query 加载菜单数据
  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menus', botId],
    queryFn: async () => {
      const response = await telegramMenuService.getMenus(botId);
      return (response.data || []).map((item: any) => ({
        id: item._id || Math.random().toString(36).substr(2, 9),
        text: item.text,
        command: item.command,
        url: item.url,
        order: item.order,
        children: item.children,
      }));
    },
    enabled: isOpen,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // 更新表单的默认值
  useEffect(() => {
    if (selectedItem) {
      form.reset({
        text: selectedItem.text,
        command: selectedItem.command,
        url: selectedItem.url || '',
      });
    }
  }, [selectedItem, form]);

  // 显示操作反馈
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setOperationFeedback({ type, message });
    setTimeout(() => setOperationFeedback(null), 3000);
  };

  // 更新菜单的 mutation
  const updateMenuMutation = useMutation({
    mutationFn: (items: MenuItem[]) => telegramMenuService.updateMenus(botId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus', botId] });
      showFeedback('success', '菜单已更新');
    },
    onError: () => {
      showFeedback('error', '更新菜单失败');
    }
  });

  // 更新菜单排序的 mutation
  const updateOrderMutation = useMutation({
    mutationFn: (items: MenuItem[]) => telegramMenuService.updateMenuOrder(
      botId, 
      items.map((item, index) => ({ 
        id: item.id.toString(), 
        order: index 
      }))
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus', botId] });
      showFeedback('success', '菜单顺序已更新');
    },
    onError: () => {
      showFeedback('error', '更新菜单排序失败');
    }
  });

  // 同步到Telegram的 mutation
  const syncToTelegramMutation = useMutation({
    mutationFn: () => telegramMenuService.syncToTelegram(botId),
  });

  // 添加到历史记录
  const addToHistory = (items: MenuItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...items]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex] ?? [];
      setHistoryIndex(newIndex);
      updateMenuMutation.mutate(previousState);
    }
  };

  // 重做
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex] ?? [];
      setHistoryIndex(newIndex);
      updateMenuMutation.mutate(nextState);
    }
  };

  // 在菜单更新时添加到历史记录
  useEffect(() => {
    if (menuItems.length > 0 && historyIndex === -1) {
      addToHistory(menuItems);
    }
  }, [menuItems]);

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: "新菜单项",
      command: "/start",
      order: menuItems.length,
    };
    const newItems = [...menuItems, newItem];
    addToHistory(newItems);
    updateMenuMutation.mutate(newItems);
    setSelectedItem(newItem);
  };

  const removeMenuItem = async (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const updatedItems = menuItems.filter(item => item.id !== itemToDelete.id);
      addToHistory(updatedItems);
      updateMenuMutation.mutate(updatedItems);
      setSelectedItem(null);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem!);

    // 更新排序
    try {
      addToHistory(items);
      await updateOrderMutation.mutateAsync(items);
    } catch (error) {
      console.error('更新排序失败:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof menuItemSchema>) => {
    try {
      setSaving(true);
      const updatedItems = menuItems.map(item => 
        item.id === selectedItem?.id
          ? { ...item, ...values }
          : item
      );

      // 保存到数据库并同步到Telegram
      const response = await updateMenuMutation.mutateAsync(updatedItems);
      if (response.success) {
        const syncResponse = await syncToTelegramMutation.mutateAsync();
        if (syncResponse.success) {
          toast({
            description: "菜单配置已保存并同步到Telegram",
          });
        } else {
          toast({
            variant: "destructive",
            title: "同步失败",
            description: "菜单已保存但同步到Telegram失败，请稍后重试",
          });
        }
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "保存菜单配置失败",
      });
    } finally {
      setSaving(false);
    }
  };

  const MenuItemComponent = ({ item, index }: { item: MenuItem; index: number }) => {
    const [isDragging, setIsDragging] = useState(false);

    return (
      <Draggable draggableId={item.id} index={index}>
        {(provided, snapshot) => {
          // 当拖拽状态改变时更新 isDragging
          if (snapshot.isDragging !== isDragging) {
            setIsDragging(snapshot.isDragging);
          }

          return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 group">
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab hover:bg-muted/80 rounded p-1"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div 
                  className={`flex-1 flex items-center gap-2 p-2 rounded-md border border-border bg-background/30 hover:bg-muted/50 transition-colors ${
                    selectedItem?.id === item.id ? "bg-muted" : ""
                  } ${isDragging ? "cursor-grabbing shadow-lg" : "cursor-pointer"}`}
                  onClick={() => !isDragging && setSelectedItem(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-medium truncate">{item.text}</span>
                      {item.command && (
                        <span className="text-sm text-muted-foreground/80 font-mono shrink-0">
                          {item.command}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8  group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  onClick={() => removeMenuItem(item)}
                  disabled={isDragging}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        }}
      </Draggable>
    );
  };

  // 在 MenuSettings 组件中添加命令重复检查
  const validateCommand = (command: string, currentItemId?: string) => {
    // 检查命令格式
    if (!command.startsWith('/')) {
      return "命令必须以/开头";
    }
    
    // 检查命令是否重复
    const isDuplicate = menuItems.some(item => 
      item.command === command && item.id !== currentItemId
    );
    
    if (isDuplicate) {
      return "该命令已存在";
    }
    
    return true;
  };

  // 添加命令预览组件
  const CommandPreview = ({ command, text }: { 
    command: string; 
    text: string;
  }) => {
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

  // 添加键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑表单，不处理快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + S: 保存更改
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedItem) {
          form.handleSubmit(onSubmit)();
        }
      }

      // Ctrl/Cmd + N: 添加新菜单项
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addMenuItem();
      }

      // Delete/Backspace: 删除选中的菜单项
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
        e.preventDefault();
        removeMenuItem(selectedItem);
      }

      // Esc: 取消选择
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
      }

      // 上下箭头：选择菜单项
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = selectedItem 
          ? menuItems.findIndex(item => item.id === selectedItem.id)
          : -1;
        
        const selectItem = (item: MenuItem | undefined) => {
          if (item) setSelectedItem(item);
        };
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          selectItem(menuItems[currentIndex - 1]);
        } else if (e.key === 'ArrowDown' && currentIndex < menuItems.length - 1) {
          selectItem(menuItems[currentIndex + 1]);
        } else if (currentIndex === -1 && menuItems.length > 0) {
          selectItem(menuItems[0]);
        }
      }

      // Ctrl/Cmd + Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z: 重做
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, menuItems, form, addMenuItem, removeMenuItem, undo, redo]);

  // 添加快捷键提示
  const ShortcutHint = ({ shortcut, action }: { shortcut: string; action: string }) => (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{action}</span>
      <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">{shortcut}</kbd>
    </div>
  );

  // 添加撤销/重做按钮
  const UndoRedoButtons = () => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={historyIndex <= 0}
        className="h-8 w-8"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={historyIndex >= history.length - 1}
        className="h-8 w-8"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-3xl relative">
            {/* 加载状态 */}
            {(isLoading || updateMenuMutation.isPending || updateOrderMutation.isPending) && (
              <LoadingOverlay />
            )}

            {/* 操作反馈 */}
            {operationFeedback && (
              <OperationFeedback
                type={operationFeedback.type}
                message={operationFeedback.message}
              />
            )}

            <DrawerHeader>
              <div className="flex items-center justify-between">
                <DrawerTitle>配置机器人菜单</DrawerTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="grid gap-2">
                      <h4 className="font-medium leading-none mb-2">键盘快捷键</h4>
                      <div className="grid gap-1">
                        <ShortcutHint shortcut="Ctrl + S" action="保存更改" />
                        <ShortcutHint shortcut="Ctrl + N" action="添加菜单项" />
                        <ShortcutHint shortcut="Delete" action="删除菜单项" />
                        <ShortcutHint shortcut="Esc" action="取消选择" />
                        <ShortcutHint shortcut="↑/↓" action="选择菜单项" />
                        <ShortcutHint shortcut="Ctrl + Z" action="撤销" />
                        <ShortcutHint shortcut="Ctrl + Shift + Z" action="重做" />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <DrawerDescription>
                设置机器人的命令菜单，支持拖拽排序
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium">菜单项</h3>
                  <UndoRedoButtons />
                </div>
                <Button onClick={addMenuItem} disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加菜单项
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="menu-items">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                        onPointerMove={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseMove={(e) => {
                          e.stopPropagation();
                        }}
                        onTouchMove={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {menuItems.map((item, index) => (
                          <MenuItemComponent
                            key={item.id}
                            item={item}
                            index={index}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              {selectedItem && (
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
                    </form>
                  </Form>
                </div>
              )}
            </div>
            <DrawerFooter>
              <Button 
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={saving || !selectedItem}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存更改
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">取消</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个菜单项吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 