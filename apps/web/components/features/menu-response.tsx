"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { CommandResponse, ResponseType } from "@/types/bot";
import { X, ChevronDown, MessageSquare, Hash as Markdown, Code, Image, Video, FileText, Layout, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Input } from "@workspace/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  ScrollArea,
  ScrollBar
} from "@workspace/ui/components/scroll-area";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";

interface Button {
  text: string;
  type: 'url' | 'callback';
  value: string;
}

interface ButtonLayout {
  buttons: Button[][];
}

interface ResponseProps {
  response: {
    types: ResponseType[];
    content: string;
    buttons?: ButtonLayout;
    parseMode?: 'Markdown' | 'HTML';
    mediaUrl?: string;
    caption?: string;
    inputPlaceholder?: string;
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    selective?: boolean;
  };
  onChange: (response: ResponseProps['response']) => void;
  onTest: () => void;
  isTesting: boolean;
  receiverId: string;
  onReceiverIdChange: (value: string) => void;
}

interface TypeConfig {
  value: ResponseType;
  label: string;
  description: string;
  icon: JSX.Element;
}

const responseTypes: TypeConfig[] = [
  { 
    value: ResponseType.TEXT, 
    label: '纯文本',
    description: '发送普通文本消息',
    icon: <MessageSquare className="h-4 w-4" />
  },
  { 
    value: ResponseType.MARKDOWN, 
    label: 'Markdown',
    description: '使用 Markdown 格式化文本',
    icon: <Markdown className="h-4 w-4" />
  },
  { 
    value: ResponseType.HTML, 
    label: 'HTML',
    description: '使用 HTML 格式化文本',
    icon: <Code className="h-4 w-4" />
  },
  { 
    value: ResponseType.PHOTO, 
    label: '图片',
    description: '发送图片消息',
    icon: <Image className="h-4 w-4" />
  },
  { 
    value: ResponseType.VIDEO, 
    label: '视频',
    description: '发送视频消息',
    icon: <Video className="h-4 w-4" />
  },
  { 
    value: ResponseType.DOCUMENT, 
    label: '文档',
    description: '发送文档文件',
    icon: <FileText className="h-4 w-4" />
  },
  { 
    value: ResponseType.INLINE_BUTTONS, 
    label: '内联按钮',
    description: '添加消息内联按钮',
    icon: <Layout className="h-4 w-4" />
  },
  { 
    value: ResponseType.KEYBOARD, 
    label: '自定义键盘',
    description: '添加自定义回复键盘',
    icon: <Keyboard className="h-4 w-4" />
  },
];

export function MenuResponse({ 
  response, 
  onChange, 
  onTest, 
  isTesting,
  receiverId,
  onReceiverIdChange
}: ResponseProps) {
  const [editingButton, setEditingButton] = useState<{
    rowIndex: number;
    buttonIndex: number;
    button: Button;
  } | null>(null);
  const [activeType, setActiveType] = useState<ResponseType | null>(null);

  // 初始化按钮布局
  const buttons = response.buttons?.buttons || [[]];

  // 添加新行
  const addRow = () => {
    const newButtons = [...buttons, []];
    onChange({
      ...response,
      buttons: { buttons: newButtons }
    });
  };

  // 添加按钮到行
  const addButtonToRow = (rowIndex: number) => {
    const newButton: Button = {
      text: '新按钮',
      type: 'url',
      value: ''
    };
    const newButtons = buttons.map((row, i) =>
      i === rowIndex ? [...row, newButton] : row
    );
    onChange({
      ...response,
      buttons: { buttons: newButtons }
    });
  };

  // 更新按钮
  const updateButton = (rowIndex: number, buttonIndex: number, updatedButton: Button) => {
    const newButtons = buttons.map((row, i) =>
      i === rowIndex
        ? row.map((btn, j) => (j === buttonIndex ? updatedButton : btn))
        : row
    );
    onChange({
      ...response,
      buttons: { buttons: newButtons }
    });
  };

  // 删除按钮
  const removeButton = (rowIndex: number, buttonIndex: number) => {
    const newButtons = buttons.map((row, i) =>
      i === rowIndex ? row.filter((_, j) => j !== buttonIndex) : row
    ).filter(row => row.length > 0);
    onChange({
      ...response,
      buttons: { buttons: newButtons.length > 0 ? newButtons : [[]] }
    });
  };

  // 渲染响应内容编辑器
  const renderContentEditor = (type: ResponseType) => {
    switch (type) {
      case ResponseType.TEXT:
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">文本内容</label>
            <textarea
              value={response.content}
              onChange={(e) => onChange({ ...response, content: e.target.value })}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
              placeholder="输入文本内容..."
            />
          </div>
        );

      case ResponseType.MARKDOWN:
      case ResponseType.HTML:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {type === ResponseType.MARKDOWN ? 'Markdown' : 'HTML'} 内容
              </label>
              <textarea
                value={response.content}
                onChange={(e) => onChange({ 
                  ...response, 
                  content: e.target.value,
                  parseMode: type === ResponseType.MARKDOWN ? 'Markdown' : 'HTML'
                })}
                className="w-full min-h-[150px] font-mono rounded-md border border-input bg-background px-3 py-2"
                placeholder={`输入 ${type === ResponseType.MARKDOWN ? 'Markdown' : 'HTML'} 内容...`}
              />
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <label className="text-sm font-medium">预览</label>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: response.content 
                }}
              />
            </div>
          </div>
        );

      case ResponseType.PHOTO:
      case ResponseType.VIDEO:
      case ResponseType.DOCUMENT:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">媒体 URL</label>
              <Input
                value={response.mediaUrl || ''}
                onChange={(e) => onChange({ ...response, mediaUrl: e.target.value })}
                className="w-full"
                placeholder="输入媒体文件的 URL..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">说明文本</label>
              <textarea
                value={response.caption || ''}
                onChange={(e) => onChange({ ...response, caption: e.target.value })}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                placeholder="输入媒体说明文本..."
              />
            </div>
            {response.mediaUrl && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <label className="text-sm font-medium">预览</label>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  {type === ResponseType.PHOTO && (
                    <img
                      src={response.mediaUrl}
                      alt={response.caption || '预览图片'}
                      className="max-h-full rounded-lg object-contain"
                    />
                  )}
                  {type === ResponseType.VIDEO && (
                    <video
                      src={response.mediaUrl}
                      controls
                      className="max-h-full rounded-lg"
                    />
                  )}
                  {type === ResponseType.DOCUMENT && (
                    <div className="flex items-center gap-3 p-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {response.mediaUrl ? response.mediaUrl.split('/').pop() : '文档文件'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          点击下载文件
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {response.caption && (
                  <p className="text-sm text-muted-foreground">{response.caption}</p>
                )}
              </div>
            )}
          </div>
        );

      case ResponseType.INLINE_BUTTONS:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文本内容</label>
              <textarea
                value={response.content}
                onChange={(e) => onChange({ ...response, content: e.target.value })}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                placeholder="输入文本内容..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">内联按钮配置</label>
                <Button variant="outline" size="sm" onClick={addRow}>
                  添加按钮行
                </Button>
              </div>
              <div className="space-y-2">
                {buttons.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      {row.map((button, buttonIndex) => (
                        <div key={buttonIndex} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setEditingButton({
                              rowIndex,
                              buttonIndex,
                              button
                            })}
                          >
                            {button.text || '未命名按钮'}
                            {button.type === 'url' && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                🔗
                              </span>
                            )}
                            {button.type === 'callback' && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ⚡
                              </span>
                            )}
                          </Button>
                        </div>
                      ))}
                      {row.length < 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addButtonToRow(rowIndex)}
                        >
                          添加按钮
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {buttons.some(row => row.length > 0) && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <label className="text-sm font-medium">预览</label>
                <div className="rounded-lg border bg-background p-4">
                  <p className="mb-4">{response.content || '消息内容'}</p>
                  <div className="space-y-2">
                    {buttons.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex gap-2">
                        {row.map((button, buttonIndex) => (
                          <Button
                            key={buttonIndex}
                            variant="secondary"
                            className="flex-1"
                            disabled
                          >
                            {button.text}
                            {button.type === 'url' && (
                              <span className="ml-1 text-xs">🔗</span>
                            )}
                            {button.type === 'callback' && (
                              <span className="ml-1 text-xs">⚡</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case ResponseType.KEYBOARD:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文本内容</label>
              <textarea
                value={response.content}
                onChange={(e) => onChange({ ...response, content: e.target.value })}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                placeholder="输入文本内容..."
              />
            </div>

            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <h4 className="font-medium">键盘选项</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    输入框占位符
                  </label>
                  <Input
                    value={response.inputPlaceholder || ''}
                    onChange={(e) => onChange({ 
                      ...response, 
                      inputPlaceholder: e.target.value 
                    })}
                    placeholder="请输入..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    键盘大小
                  </label>
                  <select
                    value={response.resizeKeyboard ? 'true' : 'false'}
                    onChange={(e) => onChange({
                      ...response,
                      resizeKeyboard: e.target.value === 'true'
                    })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="true">自适应大小</option>
                    <option value="false">标准大小</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    使用后自动隐藏
                  </label>
                  <select
                    value={response.oneTimeKeyboard ? 'true' : 'false'}
                    onChange={(e) => onChange({
                      ...response,
                      oneTimeKeyboard: e.target.value === 'true'
                    })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="true">是</option>
                    <option value="false">否</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    选择性显示
                  </label>
                  <select
                    value={response.selective ? 'true' : 'false'}
                    onChange={(e) => onChange({
                      ...response,
                      selective: e.target.value === 'true'
                    })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="true">仅特定用户可见</option>
                    <option value="false">所有用户可见</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">自定义键盘配置</label>
                <Button variant="outline" size="sm" onClick={addRow}>
                  添加按钮行
                </Button>
              </div>
              <div className="space-y-2">
                {buttons.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      {row.map((button, buttonIndex) => (
                        <div key={buttonIndex} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setEditingButton({
                              rowIndex,
                              buttonIndex,
                              button: {
                                ...button,
                                type: 'callback',
                                value: button.text
                              }
                            })}
                          >
                            {button.text || '未命名按钮'}
                          </Button>
                        </div>
                      ))}
                      {row.length < 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addButtonToRow(rowIndex)}
                        >
                          添加按钮
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {buttons.some(row => row.length > 0) && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <label className="text-sm font-medium">预览</label>
                <div className="rounded-lg border bg-background p-4">
                  <p className="mb-4">{response.content || '消息内容'}</p>
                  {response.inputPlaceholder && (
                    <div className="mb-4 px-3 py-2 bg-muted/30 rounded text-sm text-muted-foreground">
                      {response.inputPlaceholder}
                    </div>
                  )}
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                    {buttons.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex gap-2">
                        {row.map((button, buttonIndex) => (
                          <Button
                            key={buttonIndex}
                            variant="outline"
                            className="flex-1 bg-background"
                            disabled
                          >
                            {button.text}
                          </Button>
                        ))}
                      </div>
                    ))}
                  </div>
                  {(response.oneTimeKeyboard || response.selective) && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {response.oneTimeKeyboard && "使用后自动隐藏 • "}
                      {response.selective && "仅特定用户可见"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 切换响应类型
  const toggleResponseType = (type: ResponseType) => {
    const types = response.types || [];
    let newTypes = types.includes(type)
      ? types.filter(t => t !== type)
      : [...types, type];
    
    // 处理类型之间的互斥关系
    if (type === ResponseType.TEXT && newTypes.includes(type)) {
      newTypes = newTypes.filter(t => ![ResponseType.MARKDOWN, ResponseType.HTML].includes(t));
    }
    if ([ResponseType.MARKDOWN, ResponseType.HTML].includes(type) && newTypes.includes(type)) {
      newTypes = newTypes.filter(t => t !== ResponseType.TEXT);
    }
    if ([ResponseType.INLINE_BUTTONS, ResponseType.KEYBOARD].includes(type) && newTypes.includes(type)) {
      newTypes = newTypes.filter(t => ![ResponseType.INLINE_BUTTONS, ResponseType.KEYBOARD].includes(t) || t === type);
    }

    onChange({
      ...response,
      types: newTypes,
    });
  };

  // 渲染响应类型选择器
  const renderTypeSelector = () => {
    return (
      <ScrollArea className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          {responseTypes.map(type => (
            <Card
              key={type.value}
              className={cn(
                "relative group cursor-pointer transition-all duration-200",
                "hover:shadow-md hover:border-primary/50",
                response.types?.includes(type.value) && "border-primary bg-primary/5",
              )}
              onClick={() => {
                toggleResponseType(type.value);
                setActiveType(type.value);
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "p-2 rounded-lg",
                    response.types?.includes(type.value) 
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {type.icon}
                  </div>
                  {response.types?.includes(type.value) && (
                    <Badge variant="default" className="h-5">已选</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">{type.label}</h4>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">响应类型</CardTitle>
              <CardDescription>
                选择一个或多个响应类型来丰富回复内容
              </CardDescription>
            </div>
            <Badge variant="secondary" className="h-6">
              已选择 {response.types?.length || 0} 种类型
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderTypeSelector()}
        </CardContent>
      </Card>

      {response.types && response.types.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">响应配置</CardTitle>
            <CardDescription>
              配置每种响应类型的具体内容和行为
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion
              type="single"
              collapsible
              defaultValue={activeType?.toString()}
              className="w-full"
            >
              {response.types?.map((type) => {
                const typeConfig = responseTypes.find(t => t.value === type);
                return (
                  <AccordionItem 
                    key={type} 
                    value={type.toString()} 
                    className="border-b last:border-b-0"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline group">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            "bg-primary/10 text-primary"
                          )}>
                            {typeConfig?.icon}
                          </div>
                          <div className="space-y-1 text-left">
                            <span className="text-sm font-medium">
                              {typeConfig?.label}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {typeConfig?.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleResponseType(type);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 py-3">
                        <div className="rounded-lg border bg-card">
                          <div className="p-4">
                            {renderContentEditor(type)}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">测试响应</CardTitle>
          <CardDescription>
            发送测试消息以预览响应效果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                value={receiverId}
                onChange={(e) => onReceiverIdChange(e.target.value)}
                placeholder="输入接收消息的用户ID"
                className="h-10"
              />
            </div>
            <Button
              onClick={onTest}
              disabled={isTesting}
              className="min-w-[120px] h-10 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {isTesting ? '测试中...' : '测试响应'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {editingButton && (
        <Sheet open={!!editingButton} onOpenChange={() => setEditingButton(null)}>
          <SheetContent className="sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>编辑按钮</SheetTitle>
              <p className="text-sm text-muted-foreground">
                配置按钮的显示文本和行为
              </p>
            </SheetHeader>
            <div className="mt-6">
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      按钮文本
                    </label>
                    <Input
                      value={editingButton.button.text}
                      onChange={(e) => setEditingButton({
                        ...editingButton,
                        button: { ...editingButton.button, text: e.target.value }
                      })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      按钮类型
                    </label>
                    <select
                      value={editingButton.button.type}
                      onChange={(e) => setEditingButton({
                        ...editingButton,
                        button: { ...editingButton.button, type: e.target.value as 'url' | 'callback' }
                      })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="url">URL</option>
                      <option value="callback">回调</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {editingButton.button.type === 'url' ? 'URL' : '回调数据'}
                  </label>
                  <Input
                    value={editingButton.button.value}
                    onChange={(e) => setEditingButton({
                      ...editingButton,
                      button: { ...editingButton.button, value: e.target.value }
                    })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingButton(null)}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  updateButton(
                    editingButton.rowIndex,
                    editingButton.buttonIndex,
                    editingButton.button
                  );
                  setEditingButton(null);
                }}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                保存
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
} 