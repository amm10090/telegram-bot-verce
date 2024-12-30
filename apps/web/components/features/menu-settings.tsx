"use client";

import { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Trash, GripVertical, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
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
  command: z.string().min(1, "命令不能为空"),
  url: z.string().url("请输入有效的URL").optional().or(z.literal('')),
});

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

  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      text: "",
      command: "",
      url: "",
    },
  });

  // 使用 React Query 加载菜单数据
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menus', botId],
    queryFn: async () => {
      const response = await telegramMenuService.getMenus(botId);
      return response.data.map((item: any) => ({
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

  // 更新菜单的 mutation
  const updateMenuMutation = useMutation({
    mutationFn: (items: MenuItem[]) => telegramMenuService.updateMenus(botId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus', botId] });
    },
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
      toast({
        description: "菜单顺序已更新",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "错误",
        description: "更新菜单排序失败",
      });
    }
  });

  // 同步到Telegram的 mutation
  const syncToTelegramMutation = useMutation({
    mutationFn: () => telegramMenuService.syncToTelegram(botId),
  });

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: "新菜单项",
      command: "/start",
      order: menuItems.length,
    };
    updateMenuMutation.mutate([...menuItems, newItem]);
    setSelectedItem(newItem);
  };

  const removeMenuItem = async (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const updatedItems = menuItems.filter(item => item.id !== itemToDelete.id);
      updateMenuMutation.mutate(updatedItems);
      setSelectedItem(null);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
      toast({
        description: "菜单项已删除",
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem!);

    // 更新排序
    try {
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
                  <span className="flex-1 font-medium">{item.text}</span>
                  {item.command && (
                    <span className="text-sm text-muted-foreground/80 font-mono">
                      {item.command}
                    </span>
                  )}
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

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-3xl">
            <DrawerHeader>
              <DrawerTitle>配置机器人菜单</DrawerTitle>
              <DrawerDescription>
                设置机器人的命令菜单，支持拖拽排序
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">菜单项</h3>
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
                          <FormDescription>
                            显示在菜单中的文本
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
                            <Input {...field} placeholder="/start" />
                          </FormControl>
                          <FormDescription>
                            触发的命令，以/开头
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  </form>
                </Form>
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