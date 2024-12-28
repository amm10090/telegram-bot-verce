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

// 定义菜单项的类型
interface MenuItem {
  id: string;
  text: string;
  command?: string;
  url?: string;
  order: number;
  children?: MenuItem[];
}

// 定义表单验证模式
const menuItemSchema = z.object({
  text: z.string().min(1, "菜单文本不能为空"),
  command: z.string().optional(),
  url: z.string().url("请输入有效的URL").optional().or(z.literal('')),
});

export function MenuSettings({ botId, isOpen, onClose }: { 
  botId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const intl = useIntl();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
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

  // 加载菜单数据
  useEffect(() => {
    const loadMenuItems = async () => {
      if (!botId || !isOpen) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/bot/telegram/bots/${botId}/menu`);
        const data = await response.json();
        
        if (data.success) {
          setMenuItems(data.data);
        } else {
          toast({
            variant: "destructive",
            title: "错误",
            description: data.message || "加载菜单失败",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "加载菜单失败",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, [botId, isOpen, toast]);

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: "新菜单项",
      order: menuItems.length,
    };
    setMenuItems([...menuItems, newItem]);
    setSelectedItem(newItem);
  };

  const removeMenuItem = async (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setMenuItems(menuItems.filter(item => item.id !== itemToDelete.id));
      setSelectedItem(null);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
      toast({
        description: "菜单项已删除",
      });
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem!);

    // 更新排序
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setMenuItems(updatedItems);
    updateMenuOrder(updatedItems);
  };

  const updateMenuOrder = async (items: MenuItem[]) => {
    try {
      const response = await fetch(`/api/bot/telegram/bots/${botId}/menu`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orders: items.map((item, index) => ({
            id: item.id,
            order: index,
          })),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "更新菜单排序失败",
      });
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

      const response = await fetch(`/api/bot/telegram/bots/${botId}/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu: updatedItems,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMenuItems(updatedItems);
        toast({
          description: "菜单配置已保存",
        });
        onClose();
      } else {
        throw new Error(data.message);
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
                  className="cursor-grab hover:bg-accent rounded p-1"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div 
                  className={`flex-1 flex items-center gap-2 p-2 rounded-md hover:bg-accent ${
                    selectedItem?.id === item.id ? "bg-accent" : ""
                  } ${isDragging ? "cursor-grabbing" : "cursor-pointer"}`}
                  onClick={() => !isDragging && setSelectedItem(item)}
                >
                  <span className="flex-1">{item.text}</span>
                  {item.command && (
                    <span className="text-sm text-muted-foreground">
                      {item.command}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
                <Button onClick={addMenuItem} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加菜单项
                </Button>
              </div>
              
              {loading ? (
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