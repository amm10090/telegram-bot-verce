"use client";

/**
 * 菜单设置主组件
 * 负责管理菜单项的整体状态和操作
 * 包括：拖拽排序、添加、删除、编辑、撤销/重做等功能
 */

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, Loader2, Keyboard, Undo2, Redo2 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { MenuItem, MenuItemComponent } from './menu-item';
import { MenuForm, menuItemSchema } from './menu-form';
import { z } from 'zod';
import { cn } from "@/lib/utils";

/**
 * 加载状态遮罩组件
 * 在数据加载或操作进行时显示
 */
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">正在处理...</span>
    </div>
  </div>
);

/**
 * 操作反馈组件
 * 显示操作成功或失败的提示信息
 */
const OperationFeedback = ({ type, message }: { type: 'success' | 'error'; message: string }) => (
  <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg
    flex items-center gap-2 text-sm transition-all duration-200
    ${type === 'success' ? "bg-success/90 text-success-foreground" : "bg-destructive/90 text-destructive-foreground"}`}>
    {type === 'success' ? "✓" : "✕"} {message}
  </div>
);

/**
 * 快捷键提示组件
 * 显示可用的键盘快捷键
 */
const ShortcutHint = ({ shortcut, action }: { shortcut: string; action: string }) => (
  <div className="flex items-center justify-between text-xs text-muted-foreground">
    <span>{action}</span>
    <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">{shortcut}</kbd>
  </div>
);

/**
 * 撤销/重做按钮组件
 * 用于历史操作管理
 */
const UndoRedoButtons = ({ 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo 
}: { 
  onUndo: () => void; 
  onRedo: () => void; 
  canUndo: boolean; 
  canRedo: boolean; 
}) => (
  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      onClick={onUndo}
      disabled={!canUndo}
      className="h-8 w-8"
    >
      <Undo2 className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={onRedo}
      disabled={!canRedo}
      className="h-8 w-8"
    >
      <Redo2 className="h-4 w-4" />
    </Button>
  </div>
);

/**
 * 菜单设置组件
 * @param botId - 机器人ID
 * @param isOpen - 抽屉是否打开
 * @param onClose - 关闭抽屉的回调函数
 */
export function MenuSettings({ botId, isOpen, onClose }: { 
  botId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  // 状态管理
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

  // 加载菜单数据
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

  /**
   * 显示操作反馈信息
   */
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

  /**
   * 历史记录管理
   */
  const addToHistory = (items: MenuItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...items]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销操作
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex] ?? [];
      setHistoryIndex(newIndex);
      updateMenuMutation.mutate(previousState);
    }
  };

  // 重做操作
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex] ?? [];
      setHistoryIndex(newIndex);
      updateMenuMutation.mutate(nextState);
    }
  };

  // 初始化历史记录
  useEffect(() => {
    if (menuItems.length > 0 && historyIndex === -1) {
      addToHistory(menuItems);
    }
  }, [menuItems]);

  /**
   * 菜单项操作
   */
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

  /**
   * 处理拖拽结束事件
   * 更新菜单项顺序
   */
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem!);

    try {
      addToHistory(items);
      await updateOrderMutation.mutateAsync(items);
    } catch (error) {
      console.error('更新排序失败:', error);
    }
  };

  /**
   * 处理表单提交
   * 更新菜单项并同步到Telegram
   */
  const onSubmit = async (values: z.infer<typeof menuItemSchema>) => {
    try {
      setSaving(true);
      const updatedItems = menuItems.map(item => 
        item.id === selectedItem?.id
          ? { ...item, ...values }
          : item
      );

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

  /**
   * 键盘快捷键处理
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 保存更改
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedItem) {
          onSubmit(selectedItem);
        }
      }

      // 添加新菜单项
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addMenuItem();
      }

      // 删除选中的菜单项
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
        e.preventDefault();
        removeMenuItem(selectedItem);
      }

      // 取消选择
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
      }

      // 上下箭头选择菜单项
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = selectedItem 
          ? menuItems.findIndex(item => item.id === selectedItem.id)
          : -1;
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          const prevItem = menuItems[currentIndex - 1];
          if (prevItem) setSelectedItem(prevItem);
        } else if (e.key === 'ArrowDown' && currentIndex < menuItems.length - 1) {
          const nextItem = menuItems[currentIndex + 1];
          if (nextItem) setSelectedItem(nextItem);
        } else if (currentIndex === -1 && menuItems.length > 0) {
          const firstItem = menuItems[0];
          if (firstItem) setSelectedItem(firstItem);
        }
      }

      // 撤销/重做
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, menuItems, onSubmit, addMenuItem, removeMenuItem, undo, redo]);

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-6xl relative">
            {/* 加载和操作状态指示器 */}
            {(isLoading || updateMenuMutation.isPending || updateOrderMutation.isPending) && (
              <LoadingOverlay />
            )}

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

            <div className="p-4">
              <div className="flex gap-4 transition-all duration-300 ease-in-out">
                {/* 左侧菜单列表 */}
                <div className={cn(
                  "flex-1 transition-all duration-300 ease-in-out",
                  selectedItem ? "lg:w-[300px] lg:flex-none" : "w-full"
                )}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-medium">菜单项</h3>
                        <UndoRedoButtons
                          onUndo={undo}
                          onRedo={redo}
                          canUndo={historyIndex > 0}
                          canRedo={historyIndex < history.length - 1}
                        />
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
                              onPointerMove={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                            >
                              {menuItems.map((item, index) => (
                                <MenuItemComponent
                                  key={item.id}
                                  item={item}
                                  index={index}
                                  selectedItem={selectedItem}
                                  setSelectedItem={setSelectedItem}
                                  onRemove={removeMenuItem}
                                />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </div>
                </div>

                {/* 右侧配置面板 */}
                <div className={cn(
                  "lg:block transition-all duration-300 ease-in-out",
                  selectedItem 
                    ? "opacity-100 translate-x-0 lg:w-[calc(100%-300px-1rem)]" 
                    : "lg:w-0 opacity-0 -translate-x-4 hidden"
                )}>
                  {selectedItem && (
                    <div className="bg-card rounded-lg p-4 shadow-sm">
                      <MenuForm
                        selectedItem={selectedItem}
                        menuItems={menuItems}
                        onSubmit={onSubmit}
                        saving={saving}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">关闭</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 删除确认对话框 */}
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