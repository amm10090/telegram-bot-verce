/**
 * 菜单项组件
 * 
 * 该组件用于在菜单列表中展示单个菜单项，支持：
 * - 拖拽排序
 * - 选中状态
 * - 删除操作
 * - 响应类型预览
 */

"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Grip, Trash2, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { ResponseType } from '@/types/bot';
import { Badge } from "@workspace/ui/components/badge";

/**
 * 菜单项数据接口
 * 定义了菜单项的完整数据结构
 */
export interface MenuItem {
  id: string;                // 唯一标识符
  text: string;             // 菜单显示文本
  command: string;          // 触发命令
  order: number;            // 排序序号
  response?: {              // 响应配置
    types: ResponseType[];  // 响应类型列表
    content: string;        // 响应内容
    buttons?: {             // 按钮配置
      buttons: Array<Array<{
        text: string;       // 按钮文本
        type: "url" | "callback";  // 按钮类型：链接或回调
        value: string;      // 按钮值
      }>>;
    };
    parseMode?: "HTML" | "Markdown";  // 内容解析模式
    mediaUrl?: string;      // 媒体文件URL
    caption?: string;       // 媒体文件说明
    inputPlaceholder?: string;  // 输入框占位符
    resizeKeyboard?: boolean;   // 是否自适应键盘大小
    oneTimeKeyboard?: boolean;  // 是否一次性键盘
    selective?: boolean;        // 是否选择性显示
  };
}

/**
 * 菜单项组件属性接口
 */
export interface MenuItemProps {
  item: MenuItem;           // 菜单项数据
  index: number;           // 在列表中的索引
  selected?: boolean;      // 是否被选中
  onSelect: () => void;    // 选中回调
  onRemove: () => void;    // 删除回调
}

/**
 * 菜单项组件
 * 用于渲染单个可拖拽的菜单项
 */
export function MenuItemComponent({
  item,
  index,
  selected,
  onSelect,
  onRemove
}: MenuItemProps) {
  const responseTypesCount = item.response?.types?.length || 0;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-all duration-200",
            "hover:border-primary/20 hover:shadow-sm",
            selected && "border-primary bg-primary/5 shadow-sm",
            !selected && "hover:scale-[1.02]",
            snapshot.isDragging && "shadow-lg rotate-2",
          )}
          onClick={onSelect}
        >
          {/* 拖拽手柄 */}
          <div
            {...provided.dragHandleProps}
            className={cn(
              "flex h-full cursor-grab items-center px-1",
              "text-muted-foreground/50 hover:text-muted-foreground",
              "active:cursor-grabbing"
            )}
          >
            <Grip className="h-4 w-4" />
          </div>

          {/* 菜单项内容 */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* 菜单文本和响应类型数量 */}
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {item.text}
              </span>
              {responseTypesCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 px-1.5 text-xs font-normal"
                >
                  {responseTypesCount} 种响应
                </Badge>
              )}
            </div>
            {/* 命令和响应预览 */}
            <div className="flex items-center gap-2 text-sm">
              <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {item.command}
              </code>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground truncate">
                {getResponsePreview(item.response)}
              </span>
            </div>
          </div>

          {/* 删除按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-destructive/10 hover:text-destructive",
              "focus:opacity-100"
            )}
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Draggable>
  );
}

/**
 * 获取响应类型的预览文本
 * @param response 响应配置对象
 * @returns 格式化的响应类型描述
 */
function getResponsePreview(response?: MenuItem['response']): string {
  if (!response) return '未配置响应';
  
  // 响应类型的中文标签映射
  const typeLabels: Record<ResponseType, string> = {
    [ResponseType.TEXT]: '文本',
    [ResponseType.MARKDOWN]: 'Markdown',
    [ResponseType.HTML]: 'HTML',
    [ResponseType.PHOTO]: '图片',
    [ResponseType.VIDEO]: '视频',
    [ResponseType.DOCUMENT]: '文档',
    [ResponseType.INLINE_BUTTONS]: '内联按钮',
    [ResponseType.KEYBOARD]: '自定义键盘'
  };

  const types = response.types || [];
  if (types.length === 0) return '未配置响应';

  const preview = types.map(type => typeLabels[type]).join('、');
  return preview;
} 