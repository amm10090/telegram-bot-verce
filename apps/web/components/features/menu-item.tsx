"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Trash, GripVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export interface MenuItem {
  id: string;
  text: string;
  command: string;
  url?: string;
  order: number;
  children?: MenuItem[];
}

interface MenuItemComponentProps {
  item: MenuItem;
  index: number;
  selectedItem: MenuItem | null;
  setSelectedItem: (item: MenuItem | null) => void;
  onRemove: (item: MenuItem) => void;
}

export function MenuItemComponent({ 
  item, 
  index, 
  selectedItem, 
  setSelectedItem, 
  onRemove 
}: MenuItemComponentProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => {
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-medium truncate">{item.text}</span>
                    {item.command && (
                      <span className="text-sm text-muted-foreground/80 font-mono shrink-0">
                        {item.command}
                      </span>
                    )}
                  </div>
                </div>
              </div>
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