"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Trash, GripVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { MenuItem } from "@/types/bot";

export interface MenuItemProps {
  item: MenuItem & { id: string };
  index: number;
  selectedItem: (MenuItem & { id: string }) | null;
  setSelectedItem: (item: (MenuItem & { id: string }) | null) => void;
  onRemove: (item: MenuItem & { id: string }) => void;
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
}: MenuItemProps) {
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