/**
 * 菜单设置组件
 * 
 * 该组件提供了一个完整的菜单管理界面，允许用户：
 * - 查看和编辑现有的菜单项
 * - 添加新的菜单项
 * - 拖拽排序菜单项
 * - 删除菜单项
 * - 支持撤销/重做操作
 */

"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, Loader2, Keyboard, Undo2, Redo2, Settings, X, FileText, Command, ChevronRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as z from "zod";
import { useBotContext } from "@/contexts/BotContext";
import { ResponseType } from "@/types/bot";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@workspace/ui/components/sheet";
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
import { MenuItemComponent } from './menu-item';
import { MenuForm } from './menu-form';
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Badge } from "@workspace/ui/components/badge";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/**
 * 菜单项接口定义
 */
interface MenuItem {
  id: string;
  text: string;
  command: string;
  order: number;
  response?: {
    types: ResponseType[];
    content: string;
    buttons?: {
      buttons: Array<Array<{
        text: string;
        type: "url" | "callback";
        value: string;
      }>>;
    };
    parseMode?: "HTML" | "Markdown";
    mediaUrl?: string;
    caption?: string;
    inputPlaceholder?: string;
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    selective?: boolean;
  };
}

interface MenuSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 加载状态覆盖层组件
 * 在数据加载或处理时显示加载动画
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
 * 快捷键提示组件
 * 显示快捷键及其对应的操作说明
 */
const ShortcutHint = ({ shortcut, action }: { shortcut: string; action: string }) => (
  <div className="flex items-center justify-between text-xs text-muted-foreground">
    <span>{action}</span>
    <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">{shortcut}</kbd>
  </div>
);

/**
 * 撤销/重做按钮组件
 * 提供操作历史的导航功能
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

export function MenuSettings({ isOpen, onClose }: MenuSettingsProps) {
  // 状态管理
  const { selectedBot } = useBotContext();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  // 历史记录状态，用于实现撤销/重做功能
  const [history, setHistory] = useState<MenuItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  /**
   * 从服务器获取菜单项数据
   * 在组件加载和机器人选择变更时触发
   */
  useEffect(() => {
    if (selectedBot && isOpen) {
      fetchMenuItems();
    }
  }, [selectedBot?.id, isOpen]);

  /**
   * 将当前菜单项状态添加到历史记录
   * @param items 当前菜单项列表
   */
  const fetchMenuItems = async () => {
    if (!selectedBot) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/menu`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const formattedItems = data.data.map((item: any, index: number) => ({
          id: item._id || item.id,
          text: item.text || '',
          command: item.command || '',
          order: item.order || index,
          response: item.response ? {
            types: item.response.types || [ResponseType.TEXT],
            content: item.response.content || '',
            buttons: item.response.buttons,
            parseMode: item.response.parseMode,
            mediaUrl: item.response.mediaUrl,
            caption: item.response.caption,
            inputPlaceholder: item.response.inputPlaceholder,
            resizeKeyboard: item.response.resizeKeyboard,
            oneTimeKeyboard: item.response.oneTimeKeyboard,
            selective: item.response.selective
          } : undefined
        }));
        
        // 按order字段排序
        formattedItems.sort((a: MenuItem, b: MenuItem) => (a.order || 0) - (b.order || 0));
        
        setMenuItems(formattedItems);
        addToHistory(formattedItems);
        
        // 如果当前有选中的项，更新选中项的数据
        if (selectedItem) {
          const updatedSelectedItem = formattedItems.find((item: MenuItem) => item.id === selectedItem.id);
          if (updatedSelectedItem) {
            setSelectedItem(updatedSelectedItem);
          }
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "错误",
        description: err instanceof Error ? err.message : '加载菜单项失败',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 将当前菜单项状态添加到历史记录
   * @param items 当前菜单项列表
   */
  const addToHistory = (items: MenuItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...items]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  /**
   * 撤销操作
   * 恢复到历史记录中的上一个状态
   */
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      if (previousState) {
      setHistoryIndex(newIndex);
        setMenuItems(previousState);
      }
    }
  };

  /**
   * 重做操作
   * 恢复到历史记录中的下一个状态
   */
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      if (nextState) {
      setHistoryIndex(newIndex);
        setMenuItems(nextState);
      }
    }
  };

  /**
   * 添加新的菜单项
   * 创建一个新的菜单项并更新本地状态
   */
  const addMenuItem = () => {
    // 获取当前最大序号
    const maxNumber = menuItems.reduce((max, menu) => {
      const match = menu.command.match(/\/start_(\d+)$/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const newNumber = maxNumber + 1;
    const newItem: MenuItem = {
      id: `temp-${Date.now()}`, // 临时ID，保存时会被替换
      text: `命令_${newNumber}`,
      command: `/start_${newNumber}`,
      response: {
        types: [ResponseType.TEXT],
        content: "这是一条新的命令，前往菜单设置进行配置"
      },
      order: menuItems.length
    };

    const newItems = [...menuItems, newItem];
    setMenuItems(newItems);
    addToHistory(newItems);
    setSelectedItem(newItem);
  };

  /**
   * 删除菜单项
   * 打开确认对话框
   */
  const removeMenuItem = (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  /**
   * 确认删除菜单项
   * 向服务器发送删除请求并更新本地状态
   */
  const confirmDelete = async () => {
    if (!itemToDelete || !selectedBot) return;

    // 如果是临时菜单项，直接从本地状态移除
    if (itemToDelete.id.startsWith('temp-')) {
      const updatedItems = menuItems.filter(item => item.id !== itemToDelete.id);
      setMenuItems(updatedItems);
      addToHistory(updatedItems);
      setSelectedItem(null);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
      toast({
        title: "成功",
        description: "菜单项已删除",
      });
      return;
    }

    // 已保存的菜单项需要请求后端删除
    try {
      const response = await fetch(
        `/api/bot/telegram/bots/${selectedBot.id}/menu`,
        { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: itemToDelete.id })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      const updatedItems = menuItems.filter(item => item.id !== itemToDelete.id);
      setMenuItems(updatedItems);
      addToHistory(updatedItems);
      setSelectedItem(null);
      
      toast({
        title: "成功",
        description: "菜单项已删除",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "删除菜单项失败",
      });
    } finally {
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  /**
   * 处理拖拽结束事件
   * 更新菜单项顺序并同步到服务器
   */
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedBot) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (!reorderedItem) return;
    
    items.splice(result.destination.index, 0, reorderedItem);

    // 更新顺序
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    try {
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/menu/order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems.map(item => ({
            id: item.id,
            order: item.order
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu order');
      }

      setMenuItems(updatedItems);
      addToHistory(updatedItems);
      
      toast({
        title: "成功",
        description: "菜单顺序已更新",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "更新菜单顺序失败",
      });
    }
  };

  /**
   * 保存菜单项更改
   * 向服务器发送更新请求并更新本地状态
   */
  const handleSave = async (values: z.infer<typeof MenuForm.schema>) => {
    if (!selectedBot || !selectedItem) return;

    try {
      setSaving(true);
      const isNewItem = selectedItem.id.startsWith('temp-');
      
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          id: isNewItem ? undefined : selectedItem.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save menu item');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save menu item');
      }

      // 更新本地状态
      const savedItem = { ...result.data, id: result.data._id.toString() };
      let updatedItems;
      
      if (isNewItem) {
        // 对于新项目，将其添加到列表中
        updatedItems = [...menuItems.filter(item => !item.id.startsWith('temp-')), savedItem];
      } else {
        // 对于现有项目，更新它
        updatedItems = menuItems.map(item => 
          item.id === selectedItem.id ? { ...savedItem, order: item.order } : item
        );
      }

      setMenuItems(updatedItems);
      addToHistory(updatedItems);
      setSelectedItem(savedItem);

      // 手动触发同步到 Telegram
      try {
        await fetch(`/api/bot/telegram/bots/${selectedBot.id}/menu/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (syncError) {
        console.error('同步到 Telegram 失败:', syncError);
        toast({
          variant: "default",
          title: "警告",
          description: "菜单已保存，但同步到 Telegram 失败，请稍后重试",
        });
        return;
      }
      
      toast({
        title: "成功",
        description: isNewItem ? "菜单项已创建" : "菜单项已更新",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "错误",
        description: err instanceof Error ? err.message : "保存菜单项失败",
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * 键盘快捷键处理
   * 支持以下快捷键：
   * - Ctrl/Cmd + S: 保存当前菜单项
   * - Ctrl/Cmd + N: 新建菜单项
   * - Delete/Backspace: 删除当前选中的菜单项
   * - Escape: 取消选择
   * - 方向键: 导航菜单项
   * - Ctrl/Cmd + Z: 撤销
   * - Ctrl/Cmd + Shift + Z: 重做
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedItem) {
          handleSave(selectedItem);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addMenuItem();
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
        e.preventDefault();
        removeMenuItem(selectedItem);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
      }

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
  }, [selectedItem, menuItems, handleSave, addMenuItem, removeMenuItem, undo, redo]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[1000px] p-0 flex flex-col h-full bg-background">
        <div className="flex-none border-b bg-card">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Command className="h-6 w-6 text-primary" />
              <div>
                <SheetTitle className="text-xl font-semibold">菜单设置</SheetTitle>
                <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                  配置机器人的命令菜单和响应行为
                </DialogPrimitive.Description>
              </div>
            </div>
            <SheetClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
              <span className="sr-only">关闭</span>
            </SheetClose>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <div className="h-full flex flex-col sm:flex-row">
            {/* 左侧菜单列表 */}
            <div className="w-full sm:w-[320px] border-b sm:border-b-0 sm:border-r flex flex-col min-h-[200px] sm:min-h-0 bg-muted/30">
              <div className="flex-none p-4 border-b bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1" id="menu-list-description">
                    <h3 className="font-medium">菜单项</h3>
                    <p className="text-xs text-muted-foreground">
                      共 {menuItems.length} 个命令
                    </p>
                  </div>
                  <div className="flex items-center gap-2" aria-describedby="menu-list-description">
                    <UndoRedoButtons
                      onUndo={undo}
                      onRedo={redo}
                      canUndo={canUndo}
                      canRedo={canRedo}
                    />
                    <Button
                      onClick={addMenuItem}
                      size="sm"
                      className="gap-1 shadow-sm hover:shadow transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      添加
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="h-5">
                    提示
                  </Badge>
                  拖拽菜单项可以调整顺序
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2">
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
                              selected={selectedItem?.id === item.id}
                              onSelect={() => setSelectedItem(item)}
                              onRemove={() => removeMenuItem(item)}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </ScrollArea>

              <div className="flex-none p-4 bg-card border-t">
                <div className="text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-muted text-muted-foreground">⌘/Ctrl + N</kbd>
                    <span>新建菜单项</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-muted text-muted-foreground">⌘/Ctrl + S</kbd>
                    <span>保存更改</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧编辑区域 */}
            <div className="flex-1 flex flex-col min-h-0 bg-card">
              {selectedItem ? (
                <div className="h-full flex flex-col">
                  <div className="flex-none p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">
                        {selectedItem.text}
                      </h3>
                      <Badge variant="outline" className="font-mono">
                        {selectedItem.command}
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-6">
                      <MenuForm
                        selectedItem={selectedItem}
                        menuItems={menuItems}
                        onSubmit={handleSave}
                        saving={saving}
                      />
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/30">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium">选择菜单项</h3>
                    <p className="text-sm">
                      从左侧列表选择一个菜单项进行编辑
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                此操作将删除菜单项 "{itemToDelete?.text}"。删除后无法恢复，是否继续？
              </DialogPrimitive.Description>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
} 