/**
 * 菜单响应组件
 * 
 * 该组件用于配置机器人的响应行为，支持：
 * - 多种响应类型（文本、Markdown、HTML、图片、视频等）
 * - 内联按钮和自定义键盘
 * - 响应预览
 * - 测试发送功能
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { CommandResponse, ResponseType } from "@/types/bot";
import { X, ChevronDown, MessageSquare, Hash as Markdown, Code, Image, Video, FileText, Layout, Keyboard, HelpCircle } from "lucide-react";
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
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { Tooltip } from "@nextui-org/react";

// 配置 marked 以支持 Telegram Markdown 格式
marked.setOptions({
  gfm: true,
  breaks: true,
  async: false
});

/**
 * 按钮配置接口
 */
interface Button {
  text: string;           // 按钮文本
  type: 'url' | 'callback';  // 按钮类型：链接或回调
  value: string;          // 按钮值
}

/**
 * 按钮布局接口
 */
interface ButtonLayout {
  buttons: Button[][];    // 二维数组，表示按钮的行列布局
}

/**
 * 响应组件属性接口
 */
interface ResponseProps {
  response: {
    types: ResponseType[];           // 响应类型列表
    content: string;                 // 响应内容
    buttons?: ButtonLayout;          // 按钮布局配置
    parseMode?: 'Markdown' | 'HTML'; // 内容解析模式
    mediaUrl?: string;              // 媒体文件URL
    caption?: string;               // 媒体文件说明
    inputPlaceholder?: string;      // 输入框占位符
    resizeKeyboard?: boolean;       // 是否自适应键盘大小
    oneTimeKeyboard?: boolean;      // 是否一次性键盘
    selective?: boolean;            // 是否选择性显示
  };
  onChange: (response: NonNullable<ResponseProps['response']>) => void;  // 响应配置变更回调
  onTest: () => void;              // 测试响应回调
  isTesting: boolean;              // 是否正在测试
  receiverId: string;              // 测试接收者ID
  onReceiverIdChange: (value: string) => void;  // 接收者ID变更回调
}

/**
 * 响应类型配置接口
 */
interface TypeConfig {
  value: ResponseType;    // 响应类型值
  label: string;         // 显示标签
  description: string;   // 类型描述
  icon: JSX.Element;     // 类型图标
}

/**
 * 响应类型配置列表
 * 定义所有支持的响应类型及其属性
 */
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
  // 状态管理
  const [editingButton, setEditingButton] = useState<{
    rowIndex: number;
    buttonIndex: number;
    button: Button;
  } | null>(null);
  const [activeType, setActiveType] = useState<ResponseType | null>(
    response?.types?.[0] || null
  );

  // 获取当前按钮布局
  const buttons = response?.buttons?.buttons || [[]];

  // 当response变化时更新activeType
  useEffect(() => {
    const firstType = response.types?.[0];
    if (firstType && (!activeType || !response.types.includes(activeType))) {
      setActiveType(firstType);
    }
  }, [response.types, activeType]);

  /**
   * 添加新的按钮行
   */
  const addRow = () => {
    const newButtons = [...buttons, []];
    onChange({
      ...response,
      buttons: { buttons: newButtons }
    });
  };

  /**
   * 向指定行添加新按钮
   * @param rowIndex 目标行索引
   */
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

  /**
   * 更新按钮配置
   * @param rowIndex 行索引
   * @param buttonIndex 按钮索引
   * @param updatedButton 更新后的按钮配置
   */
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

  /**
   * 删除按钮
   * @param rowIndex 行索引
   * @param buttonIndex 按钮索引
   */
  const removeButton = (rowIndex: number, buttonIndex: number) => {
    const newButtons = buttons.map((row, i) =>
      i === rowIndex ? row.filter((_, j) => j !== buttonIndex) : row
    ).filter(row => row.length > 0);
    onChange({
      ...response,
      buttons: { buttons: newButtons.length > 0 ? newButtons : [[]] }
    });
  };

  /**
   * 渲染响应内容编辑器
   * 根据不同的响应类型渲染对应的编辑界面
   * @param type 响应类型
   */
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
            <div className="space-y-2">
              <label className="text-sm font-medium">预览</label>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none bg-background rounded-lg border p-4"
                dangerouslySetInnerHTML={{ 
                  __html: type === ResponseType.MARKDOWN 
                    ? DOMPurify.sanitize(marked.parse(response.content || '', { async: false }))
                    : DOMPurify.sanitize(response.content || '')
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
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm",
                    "bg-muted text-muted-foreground",
                    "hover:bg-accent hover:text-accent-foreground",
                    "cursor-pointer transition-colors"
                  )}
                  onClick={addRow}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      addRow();
                    }
                  }}
                >
                  添加按钮行
                </div>
              </div>
              <div className="space-y-2">
                {buttons.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      {row.map((button, buttonIndex) => (
                        <div key={buttonIndex} className="flex-1">
                          <div
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "w-full flex items-center px-4 py-2 rounded-md",
                              "bg-background border border-input",
                              "hover:bg-accent hover:text-accent-foreground",
                              "cursor-pointer transition-colors"
                            )}
                            onClick={() => setEditingButton({
                              rowIndex,
                              buttonIndex,
                              button
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setEditingButton({
                                  rowIndex,
                                  buttonIndex,
                                  button
                                });
                              }
                            }}
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
                          </div>
                        </div>
                      ))}
                      {row.length < 5 && (
                        <div
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-sm",
                            "bg-muted text-muted-foreground",
                            "hover:bg-accent hover:text-accent-foreground",
                            "cursor-pointer transition-colors"
                          )}
                          onClick={() => addButtonToRow(rowIndex)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              addButtonToRow(rowIndex);
                            }
                          }}
                        >
                          添加按钮
                        </div>
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
                          <div
                            key={buttonIndex}
                            className={cn(
                              "flex-1 flex items-center justify-center px-4 py-2 rounded-md",
                              "bg-secondary text-secondary-foreground",
                              "cursor-not-allowed opacity-50"
                            )}
                          >
                            <span>{button.text}</span>
                            {button.type === 'url' && (
                              <span className="ml-1 text-xs">🔗</span>
                            )}
                            {button.type === 'callback' && (
                              <span className="ml-1 text-xs">⚡</span>
                            )}
                          </div>
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
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm",
                    "bg-muted text-muted-foreground",
                    "hover:bg-accent hover:text-accent-foreground",
                    "cursor-pointer transition-colors"
                  )}
                  onClick={addRow}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      addRow();
                    }
                  }}
                >
                  添加按钮行
                </div>
              </div>
              <div className="space-y-2">
                {buttons.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      {row.map((button, buttonIndex) => (
                        <div key={buttonIndex} className="flex-1">
                          <div
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "w-full flex items-center px-4 py-2 rounded-md",
                              "bg-background border border-input",
                              "hover:bg-accent hover:text-accent-foreground",
                              "cursor-pointer transition-colors"
                            )}
                            onClick={() => setEditingButton({
                              rowIndex,
                              buttonIndex,
                              button
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setEditingButton({
                                  rowIndex,
                                  buttonIndex,
                                  button
                                });
                              }
                            }}
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
                          </div>
                        </div>
                      ))}
                      {row.length < 5 && (
                        <div
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-sm",
                            "bg-muted text-muted-foreground",
                            "hover:bg-accent hover:text-accent-foreground",
                            "cursor-pointer transition-colors"
                          )}
                          onClick={() => addButtonToRow(rowIndex)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              addButtonToRow(rowIndex);
                            }
                          }}
                        >
                          添加按钮
                        </div>
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
                          <div
                            key={buttonIndex}
                            className={cn(
                              "flex-1 flex items-center justify-center px-4 py-2 rounded-md",
                              "bg-secondary text-secondary-foreground",
                              "cursor-not-allowed opacity-50"
                            )}
                          >
                            <span>{button.text}</span>
                          </div>
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

  /**
   * 切换响应类型
   * 处理类型选择和互斥关系
   * @param type 要切换的响应类型
   */
  const toggleResponseType = (type: ResponseType) => {
    const types = response.types;
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
      // 如果切换到新的响应类型，确保保留现有内容
      content: response?.content || "",
      // 保留其他响应属性
      buttons: response?.buttons,
      parseMode: response?.parseMode,
      mediaUrl: response?.mediaUrl,
      caption: response?.caption,
      inputPlaceholder: response?.inputPlaceholder,
      resizeKeyboard: response?.resizeKeyboard,
      oneTimeKeyboard: response?.oneTimeKeyboard,
      selective: response?.selective
    });

    // 如果新类型不为空，设置为活动类型
    if (newTypes.length > 0 && newTypes[0] !== undefined) {
      setActiveType(newTypes[0]);
    } else {
      setActiveType(null);
    }
  };

  /**
   * 渲染响应类型选择器
   * 展示所有可用的响应类型供用户选择
   */
  const renderTypeSelector = () => {
    return (
      <div className="w-full p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {responseTypes.map(type => (
            <Card
              key={type.value}
              isPressable
              isHoverable
              className={cn(
                "relative",
                response.types?.includes(type.value) && "border-primary bg-primary/5",
              )}
              onPress={() => {
                toggleResponseType(type.value);
                setActiveType(type.value);
              }}
              aria-pressed={response.types?.includes(type.value)}
              aria-label={`${type.label} - ${type.description}`}
              shadow="sm"
              radius="sm"
            >
              <CardBody className="p-2">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    response.types?.includes(type.value) 
                      ? "bg-primary text-primary-foreground"
                      : "bg-default-100"
                  )}>
                    {type.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-default-500 line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium">响应类型</h3>
              <p className="text-sm text-default-500">
                选择一个或多个响应类型来丰富回复内容
              </p>
            </div>
            <Badge variant="secondary" className="h-6">
              已选择 {response.types?.length || 0} 种类型
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          {renderTypeSelector()}
        </CardBody>
      </Card>

      {response.types && response.types.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <h3 className="text-base font-medium">响应配置</h3>
            <p className="text-sm text-default-500">
              配置每种响应类型的具体内容和行为
            </p>
          </CardHeader>
          <CardBody>
            <Accordion
              type="single"
              collapsible
              defaultValue={activeType?.toString()}
              className="w-full"
            >
              {response.types?.map((type) => {
                const typeConfig = responseTypes.find(t => t.value === type);
                const typeId = `response-type-${type}`;
                return (
                  <AccordionItem 
                    key={type} 
                    value={type.toString()} 
                    className="border-b last:border-b-0"
                    aria-describedby={typeId}
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
                            <p id={typeId} className="text-xs text-default-500">
                              {typeConfig?.description}
                            </p>
                          </div>
                        </div>
                        {(type === ResponseType.HTML || type === ResponseType.MARKDOWN) && (
                          <Tooltip
                            content={
                              <div className="px-2 py-1">
                                <p className="font-medium text-small">
                                  {type === ResponseType.HTML ? '支持的 HTML 标签' : '支持的 Markdown 语法'}
                                </p>
                                <div className="mt-1 text-tiny">
                                  <div className="mb-2">
                                    <p className="font-medium text-foreground">文本样式</p>
                                    {type === ResponseType.HTML ? (
                                      <div className="ml-1 space-y-1 text-default-500">
                                        <p><code>&lt;b&gt;</code> 或 <code>&lt;strong&gt;</code> - <b>粗体</b></p>
                                        <p><code>&lt;i&gt;</code> 或 <code>&lt;em&gt;</code> - <i>斜体</i></p>
                                        <p><code>&lt;u&gt;</code> 或 <code>&lt;ins&gt;</code> - <u>下划线</u></p>
                                        <p><code>&lt;s&gt;</code> 或 <code>&lt;del&gt;</code> - <s>删除线</s></p>
                                        <p><code>&lt;tg-spoiler&gt;</code> - 剧透文本</p>
                                      </div>
                                    ) : (
                                      <div className="ml-1 space-y-1 text-default-500">
                                        <p><code>**文本**</code> 或 <code>__文本__</code> - <b>粗体</b></p>
                                        <p><code>*文本*</code> 或 <code>_文本_</code> - <i>斜体</i></p>
                                        <p><code>__*文本*__</code> - <b><i>粗斜体</i></b></p>
                                        <p><code>~文本~</code> - <s>删除线</s></p>
                                        <p><code>||文本||</code> - 剧透文本</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mb-2">
                                    <p className="font-medium text-foreground">链接</p>
                                    {type === ResponseType.HTML ? (
                                      <div className="ml-1 space-y-1 text-default-500">
                                        <p><code>&lt;a href="URL"&gt;</code> - 超链接</p>
                                        <p><code>&lt;a href="tg://user?id=123"&gt;</code> - 用户链接</p>
                                      </div>
                                    ) : (
                                      <div className="ml-1 space-y-1 text-default-500">
                                        <p><code>[文本](URL)</code> - 超链接</p>
                                        <p><code>[文本](tg://user?id=123)</code> - 用户链接</p>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">代码</p>
                                    {type === ResponseType.HTML ? (
                                      <div className="ml-1 space-y-1 text-default-500">
                                        <p><code>&lt;code&gt;</code> - 内联代码</p>
                                        <p><code>&lt;pre&gt;</code> - 代码块</p>
                                      </div>
                                    ) : (
                                      <div className="ml-1 space-y-1 text-default-500">
                                        <p><code>`代码`</code> - 内联代码</p>
                                        <p><code>```语言\n代码\n```</code> - 代码块</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            }
                            placement="right"
                            size="lg"
                            radius="lg"
                            showArrow={true}
                            delay={0}
                            closeDelay={0}
                            offset={10}
                            classNames={{
                              base: "py-2 px-4 shadow-xl",
                              arrow: "bg-background",
                            }}
                            motionProps={{
                              variants: {
                                exit: {
                                  opacity: 0,
                                  transition: {
                                    duration: 0.1,
                                    ease: "easeIn"
                                  }
                                },
                                enter: {
                                  opacity: 1,
                                  transition: {
                                    duration: 0.15,
                                    ease: "easeOut"
                                  }
                                }
                              }
                            }}
                          >
                            <Button 
                              isIconOnly
                              variant="light" 
                              size="sm"
                              radius="full"
                              className="text-default-500 hover:text-foreground"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 py-3">
                        <Card 
                          shadow="none" 
                          radius="sm"
                          className="border-none bg-default-50"
                        >
                          <CardBody>
                            {renderContentEditor(type)}
                          </CardBody>
                        </Card>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardBody>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="text-base font-medium">测试响应</h3>
          <p className="text-sm text-default-500">
            发送测试消息以预览响应效果
          </p>
        </CardHeader>
        <CardBody>
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
              color="primary"
              isLoading={isTesting}
              onClick={onTest}
              className="min-w-[120px]"
            >
              {isTesting ? '测试中...' : '测试响应'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {editingButton && (
        <Sheet open={!!editingButton} onOpenChange={() => setEditingButton(null)}>
          <SheetContent className="sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>编辑按钮</SheetTitle>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                配置按钮的显示文本和行为
              </DialogPrimitive.Description>
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
              <div
                role="button"
                tabIndex={0}
                aria-label="取消编辑按钮"
                className={cn(
                  "px-4 py-2 rounded-md",
                  "bg-background text-foreground border border-input",
                  "hover:bg-accent hover:text-accent-foreground",
                  "cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                )}
                onClick={() => setEditingButton(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setEditingButton(null);
                  }
                }}
              >
                取消
              </div>
              <div
                role="button"
                tabIndex={0}
                aria-label="保存按钮设置"
                className={cn(
                  "px-4 py-2 rounded-md",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90",
                  "cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                )}
                onClick={() => {
                  updateButton(
                    editingButton.rowIndex,
                    editingButton.buttonIndex,
                    editingButton.button
                  );
                  setEditingButton(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    updateButton(
                      editingButton.rowIndex,
                      editingButton.buttonIndex,
                      editingButton.button
                    );
                    setEditingButton(null);
                  }
                }}
              >
                保存
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
} 