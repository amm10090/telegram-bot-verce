"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, Loader2, Keyboard, Undo2, Redo2, Settings, X, FileText } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as z from "zod";
import { useBotContext } from "@/contexts/BotContext";
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

interface MenuItem {
  id: string;
  text: string;
  command: string;
  order: number;
}

interface MenuSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">正在处理...</span>
    </div>
  </div>
);

const ShortcutHint = ({ shortcut, action }: { shortcut: string; action: string }) => (
  <div className="flex items-center justify-between text-xs text-muted-foreground">
    <span>{action}</span>
    <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">{shortcut}</kbd>
  </div>
);

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
  const { selectedBot } = useBotContext();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [history, setHistory] = useState<MenuItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    if (selectedBot) {
      fetchMenuItems();
    }
  }, [selectedBot]);

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
          order: item.order || index
        }));
        setMenuItems(formattedItems);
        addToHistory(formattedItems);
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

  const addToHistory = (items: MenuItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...items]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

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

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: "新菜单项",
      command: "/start",
      order: menuItems.length,
    };
    const newItems = [...menuItems, newItem];
    setMenuItems(newItems);
    addToHistory(newItems);
    setSelectedItem(newItem);
  };

  const removeMenuItem = (item: MenuItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !selectedBot) return;

    try {
      const response = await fetch(
        `/api/bot/telegram/bots/${selectedBot.id}/menu/${itemToDelete.id}`,
        { method: 'DELETE' }
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

  const handleSave = async (values: z.infer<typeof MenuForm.schema>) => {
    if (!selectedBot) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to save menu item');
      }

      const updatedItems = menuItems.map(item => 
        item.id === selectedItem?.id
          ? { ...item, ...values }
          : item
      );

      setMenuItems(updatedItems);
      addToHistory(updatedItems);
      setSelectedItem(null);
      
          toast({
        title: "成功",
        description: "菜单项已保存",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "保存菜单项失败",
      });
    } finally {
      setSaving(false);
    }
  };

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
      <SheetContent className="w-full sm:max-w-[800px] p-0 flex flex-col h-full">
        <div className="flex-none p-4 border-b">
              <div className="flex items-center justify-between">
            <SheetTitle>菜单设置</SheetTitle>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-4 w-4" />
              <span className="sr-only">关闭</span>
            </SheetClose>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <div className="h-full flex flex-col sm:flex-row">
            {/* 菜单项列表 */}
            <div className="w-full sm:w-[280px] border-b sm:border-b-0 sm:border-r flex flex-col min-h-[200px] sm:min-h-0">
              <div className="flex-none p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">菜单项</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={undo}
                      disabled={!canUndo}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={redo}
                      disabled={!canRedo}
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addMenuItem}
                    >
                      添加菜单项
                    </Button>
                      </div>
                    </div>
                <div className="text-xs text-muted-foreground mb-2">
                  拖拽菜单项可以调整顺序
                </div>
                    </div>
                    
              <div className="flex-1 overflow-y-auto">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="menu-items">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-px"
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
                </div>

            {/* 菜单项编辑表单 */}
            <div className="flex-1 flex flex-col min-h-0">
              {selectedItem ? (
                <div className="h-full flex flex-col">
                  <div className="flex-none p-4 border-b">
                    <h3 className="text-sm font-medium">
                      编辑菜单项 - {selectedItem.command}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                      <MenuForm
                        selectedItem={selectedItem}
                        menuItems={menuItems}
                      onSubmit={handleSave}
                        saving={saving}
                      />
                    </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p>选择一个菜单项进行编辑</p>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 