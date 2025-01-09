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
import { Button, Card, CardBody, CardHeader, Input, Tooltip, Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { CommandResponse, ResponseType } from "@/types/bot";
import { X, ChevronDown, MessageSquare, Hash as Markdown, Code, Image, Video, FileText, Layout, Keyboard, HelpCircle, Link, Zap, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
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
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import * as DialogPrimitive from "@radix-ui/react-dialog";

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

// 响应类型分组
const RESPONSE_TYPE_GROUPS = {
  TEXT: {
    label: '文本消息',
    types: [
      { 
        value: ResponseType.TEXT, 
        label: '纯文本',
        description: '发送普通文本消息',
        icon: <MessageSquare className="h-4 w-4" />
      }
    ]
  },
  FORMATTED: {
    label: '格式化文本',
    types: [
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
      }
    ]
  },
  MEDIA: {
    label: '媒体消息',
    types: [
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
      }
    ]
  },
  INTERACTIVE: {
    label: '交互元素',
    types: [
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
      }
    ]
  }
} as const;

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
    const renderPreview = () => {
      let previewContent = response.content;
      let previewCaption = response.caption;

      // 处理 Markdown 格式
      if (type === ResponseType.MARKDOWN) {
        // 处理 Telegram 特殊的 Markdown 语法
        const processMarkdown = (text: string) => {
          if (!text) return '';
          
          // 处理代码块
          text = text.replace(/```(.*?)\n(.*?)```/gs, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
          });

          // 处理其他格式
          return text
            // 处理粗体
            .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
            // 处理斜体
            .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
            // 处理删除线
            .replace(/~(.*?)~/g, '<del>$1</del>')
            // 处理剧透文本
            .replace(/\|\|(.*?)\|\|/g, '<span class="spoiler">$1</span>')
            // 处理行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 处理链接
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            // 处理用户提及
            .replace(/@(\w+)/g, '<a href="tg://user?id=$1">@$1</a>')
            // 处理话题标签
            .replace(/#(\w+)/g, '<a href="https://t.me/hashtag/$1">#$1</a>')
            // 处理有序列表
            .replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
            // 处理无序列表
            .replace(/^[•\-\*]\s+(.*)$/gm, '<li>$1</li>')
            // 处理换行
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>');
        };

        previewContent = processMarkdown(previewContent);
        if (previewCaption) {
          previewCaption = processMarkdown(previewCaption);
        }
      }

      return (
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <User className="h-4 w-4" />
            <span>预览效果</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">Telegram 预览</Badge>
          </div>
          <Card className="bg-muted/30">
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Bot Name</span>
                  </div>
                  <div className="space-y-2">
                    {type === ResponseType.MARKDOWN && (
                      <div 
                        className={cn(
                          "prose prose-sm dark:prose-invert max-w-none",
                          "prose-headings:my-0 prose-p:my-0",
                          "prose-pre:bg-muted/50 prose-pre:p-3 prose-pre:rounded-md",
                          "prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                          "[&_.spoiler]:bg-muted-foreground/20 [&_.spoiler]:hover:bg-transparent",
                          "[&_li]:my-0"
                        )}
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(previewContent || '') 
                        }}
                      />
                    )}
                    {type === ResponseType.HTML && (
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(previewContent || '')
                        }}
                      />
                    )}
                    {type === ResponseType.TEXT && (
                      <p className="text-sm whitespace-pre-wrap">{previewContent}</p>
                    )}
                    {RESPONSE_TYPE_GROUPS.MEDIA.types.find(t => t.value === type) && (
                      <div className="space-y-2">
                        {response.mediaUrl && (
                          <div className="relative">
                            {type === ResponseType.PHOTO && (
                              <img
                                src={response.mediaUrl}
                                alt={previewCaption || '预览图片'}
                                className="max-h-[300px] w-full rounded-lg object-cover"
                              />
                            )}
                            {type === ResponseType.VIDEO && (
                              <video
                                src={response.mediaUrl}
                                controls
                                className="max-h-[300px] w-full rounded-lg"
                              />
                            )}
                            {type === ResponseType.DOCUMENT && (
                              <div className="flex items-center gap-3 p-4 bg-muted/10 rounded-lg">
                                <div className="h-10 w-10 flex items-center justify-center rounded bg-primary/10">
                                  <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {response.mediaUrl.split('/').pop() || '文档文件'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    点击下载文件
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {previewCaption && (
                          <p className="text-sm text-muted-foreground">{previewCaption}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    };

    switch (type) {
      case ResponseType.TEXT:
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
            {renderPreview()}
          </div>
        );

      case ResponseType.MARKDOWN:
      case ResponseType.HTML:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {type === ResponseType.MARKDOWN ? 'Markdown' : 'HTML'} 内容
                </label>
              </div>
              <div className="space-y-2">
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
            </div>
            {renderPreview()}
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
                onValueChange={(value) => onChange({ ...response, mediaUrl: value })}
                placeholder="输入媒体文件的 URL..."
                variant="bordered"
                radius="sm"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-10"
                }}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <FileText className="text-default-400 h-4 w-4" />
                  </div>
                }
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
            {renderPreview()}
          </div>
        );

      case ResponseType.INLINE_BUTTONS:
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

            {type === ResponseType.KEYBOARD && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h4 className="font-medium">键盘选项</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      输入框占位符
                    </label>
                    <Input
                      value={response.inputPlaceholder || ''}
                      onValueChange={(value) => onChange({ 
                        ...response, 
                        inputPlaceholder: value 
                      })}
                      placeholder="请输入提示文本..."
                      variant="bordered"
                      radius="sm"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10"
                      }}
                      description="用户看到的输入框提示文本"
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
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {type === ResponseType.INLINE_BUTTONS ? '内联按钮配置' : '自定义键盘配置'}
                </label>
                <Button
                  size="sm"
                  variant="light"
                  onPress={addRow}
                  className="text-sm"
                  startContent={<Plus className="h-4 w-4" />}
                >
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
                            size="sm"
                            variant="light"
                            className="w-full flex items-center justify-start"
                            onPress={() => setEditingButton({
                              rowIndex,
                              buttonIndex,
                              button
                            })}
                          >
                            {button.text || '未命名按钮'}
                            {button.type === 'url' && (
                              <Link className="ml-1 h-3 w-3 text-muted-foreground" />
                            )}
                            {button.type === 'callback' && (
                              <Zap className="ml-1 h-3 w-3 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      ))}
                      {row.length < 8 && (
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => addButtonToRow(rowIndex)}
                          className="text-sm"
                          startContent={<Plus className="h-4 w-4" />}
                        >
                          添加按钮
                        </Button>
                      )}
                    </div>
                    {buttons.length > 1 && (
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        color="danger"
                        onPress={() => removeButton(rowIndex, 0)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {renderPreview()}
          </div>
        );

      default:
        return null;
    }
  };

  /**
   * 渲染响应类型选择器
   * 展示所有可用的响应类型供用户选择
   */
  const renderTypeSelector = () => {
    return (
      <div className="w-full p-4">
        <div className="space-y-6">
          {Object.entries(RESPONSE_TYPE_GROUPS).map(([group, config]) => (
            <div key={group} className="space-y-2">
              <h4 className="text-sm font-medium text-default-600">{config.label}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {config.types.map(type => {
                  const isSelected = response.types?.[0] === type.value;
                  return (
                    <Card
                      key={type.value}
                      isPressable
                      isHoverable
                      className={cn(
                        "relative",
                        isSelected && "border-primary bg-primary/5",
                      )}
                      onPress={() => {
                        onChange({
                          ...response,
                          types: [type.value],
                          // 重置其他属性
                          content: '',
                          buttons: undefined,
                          parseMode: undefined,
                          mediaUrl: undefined,
                          caption: undefined,
                          inputPlaceholder: undefined,
                          resizeKeyboard: undefined,
                          oneTimeKeyboard: undefined,
                          selective: undefined
                        });
                        setActiveType(type.value);
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${type.label} - ${type.description}`}
                      shadow="sm"
                      radius="sm"
                    >
                      <CardBody className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isSelected 
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
                  );
                })}
              </div>
            </div>
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
                onValueChange={onReceiverIdChange}
                placeholder="输入接收消息的用户ID"
                variant="bordered"
                radius="sm"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-10"
                }}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <User className="text-default-400 h-4 w-4" />
                  </div>
                }
                description="用于测试消息发送的目标用户ID"
              />
            </div>
            <Button
              color="primary"
              isLoading={isTesting}
              onPress={onTest}
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
                      onValueChange={(value) => setEditingButton({
                        ...editingButton,
                        button: { ...editingButton.button, text: value }
                      })}
                      placeholder="输入按钮显示文本"
                      variant="bordered"
                      radius="sm"
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "h-10"
                      }}
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
                    onValueChange={(value) => setEditingButton({
                      ...editingButton,
                      button: { ...editingButton.button, value: value }
                    })}
                    placeholder={editingButton.button.type === 'url' ? '输入链接地址' : '输入回调数据'}
                    variant="bordered"
                    radius="sm"
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "h-10"
                    }}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        {editingButton.button.type === 'url' ? (
                          <Link className="text-default-400 h-4 w-4" />
                        ) : (
                          <Zap className="text-default-400 h-4 w-4" />
                        )}
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="light"
                onPress={() => setEditingButton(null)}
                className="bg-background text-foreground border border-input"
              >
                取消
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  updateButton(
                    editingButton.rowIndex,
                    editingButton.buttonIndex,
                    editingButton.button
                  );
                  setEditingButton(null);
                }}
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