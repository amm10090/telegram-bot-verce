"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Trash, GripVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

/**
 * 菜单项的数据结构定义
 * @interface MenuItem
 * @property {string} id - 唯一标识符
 * @property {string} text - 菜单显示文本
 * @property {string} command - Telegram 命令
 * @property {string} [url] - 可选的链接地址
 * @property {number} order - 排序顺序
 * @property {MenuItem[]} [children] - 可选的子菜单项
 */
export interface MenuItem {
  id: string;
  text: string;
  command: string;
  url?: string;
  order: number;
  children?: MenuItem[];
}

/**
 * 菜单项组件的属性定义
 * @interface MenuItemComponentProps
 * @property {MenuItem} item - 菜单项数据
 * @property {number} index - 在列表中的索引位置
 * @property {MenuItem | null} selectedItem - 当前选中的菜单项
 * @property {Function} setSelectedItem - 设置选中菜单项的函数
 * @property {Function} onRemove - 删除菜单项的回调函数
 */
interface MenuItemComponentProps {
  item: MenuItem;
  index: number;
  selectedItem: MenuItem | null;
  setSelectedItem: (item: MenuItem | null) => void;
  onRemove: (item: MenuItem) => void;
}

/**
 * 可拖拽的菜单项组件
 * 支持拖拽排序、选择和删除功能
 */
export function MenuItemComponent({ 
  item, 
  index, 
  selectedItem, 
  setSelectedItem, 
  onRemove 
}: MenuItemComponentProps) {
  // 跟踪当前项是否正在被拖拽
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => {
        // 更新拖拽状态
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
              {/* 拖拽手柄 */}
              <div
                {...provided.dragHandleProps}
                className="cursor-grab hover:bg-muted/80 rounded p-1"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              {/* 菜单项主体 */}
              <div 
                className={`flex-1 flex items-center gap-2 p-2 rounded-md border border-border bg-background/30 hover:bg-muted/50 transition-colors ${
                  selectedItem?.id === item.id ? "bg-muted" : ""
                } ${isDragging ? "cursor-grabbing shadow-lg" : "cursor-pointer"}`}
                onClick={() => !isDragging && setSelectedItem(item)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* 菜单文本 */}
                    <span className="flex-1 font-medium truncate">{item.text}</span>
                    {/* 命令显示 */}
                    {item.command && (
                      <span className="text-sm text-muted-foreground/80 font-mono shrink-0">
                        {item.command}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* 删除按钮 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                onClick={() => onRemove(item)}
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
} 