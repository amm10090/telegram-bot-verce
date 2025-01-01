"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Grip, Trash2, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { ResponseType } from '@/types/bot';
import { Badge } from "@workspace/ui/components/badge";

export interface MenuItem {
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

export interface MenuItemProps {
  item: MenuItem;
  index: number;
  selected?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function MenuItemComponent({
  item,
  index,
  selected,
  onSelect,
  onRemove
}: MenuItemProps) {
  const responseTypesCount = item.response?.types?.length || 0;

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

          <div className="min-w-0 flex-1 space-y-1">
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

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-destructive/10 hover:text-destructive",
              "focus:opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Draggable>
  );
}

function getResponsePreview(response?: MenuItem['response']): string {
  if (!response) return '未配置响应';
  
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