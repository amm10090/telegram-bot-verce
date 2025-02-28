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
import { Button, Card, CardBody, CardHeader, Input, Tooltip, Popover, PopoverContent, PopoverTrigger, Image as NextImage } from "@nextui-org/react";
import { CommandResponse, ResponseType } from "@/types/bot";
import { X, ChevronDown, MessageSquare, Hash as Markdown, Code, ImageIcon, Video, FileText, Layout, Keyboard, HelpCircle, Link, Zap, User, Plus } from "lucide-react";
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
 * 定义了按钮的基本属性结构
 */
interface Button {
  text: string;           // 按钮文本
  type: 'url' | 'callback';  // 按钮类型：链接或回调
  value: string;          // 按钮值：URL或回调数据
}

/**
 * 按钮布局接口
 * 使用二维数组表示按钮的行列布局
 */
interface ButtonLayout {
  buttons: Button[][];    // 二维数组，表示按钮的行列布局
}

/**
 * 响应组件属性接口
 * 定义了组件所需的所有配置项
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
 * 定义了每种响应类型的展示信息
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
    icon: <ImageIcon className="h-4 w-4" />
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

// 响应类型分组配置
// 将不同类型的响应按功能分组，便于用户选择
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
        icon: <ImageIcon className="h-4 w-4" />
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

/**
 * 菜单响应组件
 * 用于配置和预览机器人的各种响应类型
 */
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
  const [urlError, setUrlError] = useState<string | null>(null);

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
   * 在现有按钮布局中添加一个新的空行
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
    /**
     * 处理HTML内容
     * 添加语法高亮和格式化
     */
    const processHtml = (text: string) => {
      if (!text) return '';
      
      // 处理代码块
      text = text.replace(/<pre><code(?:\s+class="language-(\w+)")?>(.*?)<\/code><\/pre>/gs, (match, lang, code) => {
        // 处理 Python 代码高亮
        if (lang === 'python') {
          return `<pre><code class="language-python">${code
            .replace(/\b(def|class|return|import|from|as|if|else|elif|for|while|try|except|finally|with|in|is|not|and|or|True|False|None)\b/g, '<span class="keyword">$1</span>')
            .replace(/(?<=def\s+)(\w+)(?=\s*\()/g, '<span class="function">$1</span>')
            .replace(/"([^"]*)"|\\'([^']*)\\'|'([^']*)'/g, '<span class="string">$1$2$3</span>')
            .replace(/\b(True|False)\b/g, '<span class="boolean">$1</span>')
            .replace(/(?<!["\'])\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
            .replace(/#.*/g, '<span class="comment">$&</span>')}</code></pre>`;
        }
        return `<pre><code>${code}</code></pre>`;
      });

      // 处理其他 HTML 标签和格式
      return text
        .replace(/<code>(.*?)<\/code>/g, '<span class="inline-code">$1</span>')
        .replace(/<(tg-spoiler|span class="tg-spoiler")>(.*?)<\/(tg-spoiler|span)>/g, '<span class="spoiler">$2</span>')
        .replace(/^[•◦]\s+(.*)$/gm, '<span class="list-item">$1</span>')
        .replace(/^\d+\.\s+(.*)$/gm, '<span class="list-item">$1</span>')
        .replace(/\n/g, '<br/>');
    };

    /**
     * 渲染预览内容
     * 根据不同的响应类型展示预览效果
     */
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

      // 处理 HTML 格式
      if (response.types.includes(ResponseType.HTML)) {
        previewContent = processHtml(previewContent);
        if (previewCaption) {
          previewCaption = processHtml(previewCaption);
        }
      }

      return (
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <User className="h-4 w-4" />
            <span>预览效果</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">Telegram 预览</Badge>
          </div>
          <Card className="bg-muted/50">
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
                    {type === ResponseType.HTML && (
                      <div 
                        className={cn(
                          "text-sm leading-normal",
                          "font-normal text-foreground",
                          "[&_b]:font-semibold [&_strong]:font-semibold",
                          "[&_i]:italic [&_em]:italic",
                          "[&_u]:underline [&_ins]:underline",
                          "[&_s]:line-through [&_del]:line-through [&_strike]:line-through",
                          // 暗色模式
                          "dark:[&_pre]:bg-[#1e1e1e] dark:[&_pre_code]:text-[#d4d4d4]",
                          "dark:[&_pre_.keyword]:text-[#569cd6] dark:[&_pre_.function]:text-[#dcdcaa]",
                          "dark:[&_pre_.string]:text-[#ce9178] dark:[&_pre_.boolean]:text-[#569cd6]",
                          "dark:[&_pre_.number]:text-[#b5cea8] dark:[&_pre_.comment]:text-[#6a9955]",
                          "dark:[&_.inline-code]:bg-[#1e1e1e] dark:[&_.inline-code]:text-[#d4d4d4]",
                          // 亮色模式
                          "light:[&_pre]:bg-[#f5f5f5] light:[&_pre_code]:text-[#24292e]",
                          "light:[&_pre_.keyword]:text-[#d73a49] light:[&_pre_.function]:text-[#6f42c1]",
                          "light:[&_pre_.string]:text-[#032f62] light:[&_pre_.boolean]:text-[#005cc5]",
                          "light:[&_pre_.number]:text-[#005cc5] light:[&_pre_.comment]:text-[#6a737d]",
                          "light:[&_.inline-code]:bg-[#f6f8fa] light:[&_.inline-code]:text-[#24292e]",
                          // 通用样式
                          "[&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:shadow-sm [&_pre]:border [&_pre]:border-border/50",
                          "[&_pre_code]:block [&_pre_code]:font-mono [&_pre_code]:text-[14px] [&_pre_code]:leading-[1.6] [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-all",
                          "[&_pre_.keyword]:font-medium [&_pre_.comment]:italic",
                          "[&_.inline-code]:font-mono [&_.inline-code]:px-2 [&_.inline-code]:py-1 [&_.inline-code]:rounded-md [&_.inline-code]:text-[14px] [&_.inline-code]:whitespace-normal [&_.inline-code]:break-all [&_.inline-code]:border [&_.inline-code]:border-border/50",
                          "[&_.spoiler]:bg-muted-foreground/20 [&_.spoiler]:hover:bg-transparent [&_.spoiler]:transition-colors",
                          "[&_a]:text-blue-500 [&_a]:no-underline hover:[&_a]:underline",
                          "[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3",
                          "[&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1",
                          "whitespace-pre-wrap break-words"
                        )}
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(processHtml(previewContent || ''))
                        }}
                      />
                    )}
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
                          __html: DOMPurify.sanitize(processHtml(previewContent || ''))
                        }}
                      />
                    )}
                    {type === ResponseType.TEXT && (
                      <p className="text-sm whitespace-pre-wrap">{processHtml(previewContent || '')}</p>
                    )}
                    {(type === ResponseType.INLINE_BUTTONS || type === ResponseType.KEYBOARD) && (
                      <div className="space-y-2">
                        {response.content && (
                          <p className="text-sm whitespace-pre-wrap mb-2">{processHtml(response.content || '')}</p>
                        )}
                        {response.buttons?.buttons && (
                          <div className="space-y-1">
                            {response.buttons.buttons.map((row, rowIndex) => (
                              <div key={rowIndex} className="flex items-center gap-1">
                                {row.map((button, buttonIndex) => (
                                  <div
                                    key={buttonIndex}
                                    className={cn(
                                      "flex-1 min-w-0 h-8 px-3 flex items-center justify-center",
                                      type === ResponseType.INLINE_BUTTONS 
                                        ? "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700" 
                                        : "bg-zinc-200 hover:bg-zinc-300",
                                      "rounded-md cursor-pointer"
                                    )}
                                  >
                                    {button.type === 'url' && (
                                      <Link className="h-3.5 w-3.5 text-blue-500 mr-1" />
                                    )}
                                    {button.type === 'callback' && (
                                      <Zap className="h-3.5 w-3.5 text-blue-500 mr-1" />
                                    )}
                                    <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                                      {button.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {RESPONSE_TYPE_GROUPS.MEDIA.types.find(t => t.value === type) && (
                      <div className="space-y-2">
                        {response.mediaUrl && (
                          <div className="relative">
                            {type === ResponseType.PHOTO && (
                              <NextImage
                                src={response.mediaUrl || ''}
                                alt={previewCaption || '预览图片'}
                                classNames={{
                                  wrapper: "max-h-[300px] w-full",
                                  img: "object-cover rounded-lg"
                                }}
                                radius="lg"
                                isBlurred
                                isZoomed
                                loading="lazy"
                                fallbackSrc="/placeholder-image.jpg"
                                disableSkeleton={false}
                              />
                            )}
                            {type === ResponseType.VIDEO && (
                              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                <video
                                  src={response.mediaUrl}
                                  controls
                                  className="w-full h-full object-contain bg-black"
                                  controlsList="nodownload"
                                  playsInline
                                >
                                  <source src={response.mediaUrl} type="video/mp4" />
                                  <source src={response.mediaUrl} type="video/webm" />
                                  您的浏览器不支持视频播放。
                                </video>
                              </div>
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

    // 根据不同的响应类型渲染对应的编辑器
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
              {type === ResponseType.PHOTO && (
                <div className="space-y-2">
                  <Input
                    value={response.mediaUrl || ''}
                    onValueChange={(value) => {
                      // 验证URL格式
                      const isValidUrl = (url: string) => {
                        try {
                          new URL(url);
                          return true;
                        } catch {
                          return false;
                        }
                      };

                      // 验证图片URL
                      const isImageUrl = async (url: string) => {
                        // 如果URL为空，不进行验证
                        if (!url) return true;
                        
                        // 先验证URL格式
                        if (!isValidUrl(url)) return false;

                        // 更新状态，清除之前的错误
                        onChange({ 
                          ...response, 
                          mediaUrl: value,
                          types: [type]
                        });
                        setUrlError(null);

                        // 如果URL无效，显示错误
                        if (!isValidUrl(value)) {
                          setUrlError('URL格式无效');
                          return;
                        }
                      };

                      // 更新状态
                      onChange({ 
                        ...response, 
                        mediaUrl: value,
                        types: [type]
                      });
                    }}
                    placeholder="输入媒体文件的 URL..."
                    variant="bordered"
                    radius="sm"
                    isInvalid={!!urlError}
                    errorMessage={urlError}
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "h-10",
                      errorMessage: "text-xs text-danger"
                    }}
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <FileText className="text-default-400 h-4 w-4" />
                      </div>
                    }
                  />
                </div>
              )}
              {type !== ResponseType.PHOTO && (
                <Input
                  value={response.mediaUrl || ''}
                  onValueChange={(value) => onChange({ 
                    ...response, 
                    mediaUrl: value,
                    types: [type]
                  })}
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
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">说明文本</label>
              <textarea
                value={response.caption || ''}
                onChange={(e) => onChange({ 
                  ...response, 
                  caption: e.target.value,
                  types: [type]  // 确保设置正确的响应类型
                })}
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
                <div
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-md",
                    "bg-default-100 hover:bg-default-200",
                    "cursor-pointer transition-colors text-sm"
                  )}
                  onClick={addRow}
                >
                  <Plus className="h-4 w-4" />
                  <span>添加按钮行</span>
                </div>
              </div>
              <div className="space-y-2">
                {buttons.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      {row.map((button, buttonIndex) => (
                        <div key={buttonIndex} className="flex-1">
                          <Button
                            size="sm"
                            variant="flat"
                            className="w-full justify-start"
                            onPress={() => setEditingButton({
                              rowIndex,
                              buttonIndex,
                              button
                            })}
                          >
                            <span className="text-sm">{button.text || '未命名按钮'}</span>
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
                          variant="flat"
                          className="text-sm"
                          onPress={() => addButtonToRow(rowIndex)}
                          startContent={<Plus className="h-4 w-4" />}
                        >
                          添加按钮
                        </Button>
                      )}
                    </div>
                    {buttons.length > 1 && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        isIconOnly
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
                {config.types.map(typeConfig => {
                  const isSelected = response.types?.[0] === typeConfig.value;
                  return (
                    <Card
                      key={typeConfig.value}
                      isPressable
                      isHoverable
                      className={cn(
                        "relative",
                        isSelected && "border-primary bg-primary/5",
                      )}
                      onPress={() => {
                        onChange({
                          ...response,
                          types: [typeConfig.value],
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
                        setActiveType(typeConfig.value);
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${typeConfig.label} - ${typeConfig.description}`}
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
                            {typeConfig.icon}
                          </div>
                          <div className="space-y-1 text-left">
                            <span className="text-sm font-medium">
                              {typeConfig.label}
                            </span>
                            <p id={`response-type-${typeConfig.value}`} className="text-xs text-default-500">
                              {typeConfig.description}
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

  // 渲染主组件
  return (
    <div className="w-full space-y-6">
      {/* 响应类型选择卡片 */}
      <Card className="w-full shadow-sm">
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

      {/* 响应配置卡片 */}
      {response.types && response.types.length > 0 && (
        <Card className="w-full shadow-sm">
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

      <Card className="w-full shadow-sm">
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

      {/* 按钮编辑弹出层 */}
      {editingButton && (
        <Sheet open={!!editingButton} onOpenChange={() => setEditingButton(null)}>
          <SheetContent className="w-full max-w-[100vw] sm:max-w-[90vw] md:max-w-[600px]">
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
                variant="bordered"
                onPress={() => setEditingButton(null)}
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