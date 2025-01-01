"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Grip, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { ResponseType } from '@/types/bot';

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
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group relative flex items-center gap-2 rounded-lg border bg-card p-3 transition-colors",
            selected && "border-primary",
            !selected && "hover:border-muted-foreground/25"
          )}
          onClick={onSelect}
        >
          <div
            {...provided.dragHandleProps}
            className="flex h-full cursor-grab items-center px-1"
          >
            <Grip className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium leading-none">{item.text}</div>
            <div className="mt-1 text-sm text-muted-foreground truncate">
              {item.command}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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