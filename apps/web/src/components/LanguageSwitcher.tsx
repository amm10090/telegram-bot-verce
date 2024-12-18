// src/components/LanguageSwitcher.tsx
import React, { useCallback } from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { useIntl } from 'react-intl';
import type { SupportedLocales } from '../types/locale';
import { cn } from "@/lib/utils";
import { ChevronDown } from 'lucide-react';

// 定义支持的语言配置
const SUPPORTED_LANGUAGES = [
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
  { value: 'zh-CN', label: '中文', flag: '🇨🇳' }
] as const;

// 语言切换器组件的属性接口
interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean; // 是否使用紧凑模式
}

/**
 * 语言切换器组件
 * 用于切换应用程序的显示语言
 * 支持键盘导航和屏幕阅读器
 */
export default function LanguageSwitcher({ 
  className,
  compact = false 
}: LanguageSwitcherProps) {
  // 获取国际化相关的 hooks
  const { locale, setLocale } = useLocale();
  const intl = useIntl();

  // 处理语言切换的回调函数
  const handleLanguageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value as SupportedLocales;
    setLocale(newLocale);
    
    // 可选：通知屏幕阅读器语言已更改
    const message = intl.formatMessage(
      { id: 'language.changed' },
      { language: SUPPORTED_LANGUAGES.find(lang => lang.value === newLocale)?.label }
    );
    
    // 使用 ARIA live region 通知屏幕阅读器
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, [setLocale, intl]);

  // 获取当前语言的显示信息
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.value === locale);

  return (
    <div className={cn(
      "relative inline-block",
      className
    )}>
      <select
        value={locale}
        onChange={handleLanguageChange}
        className={cn(
          // 基础样式
          "appearance-none rounded-md text-sm",
          "border focus:outline-none focus:ring-2 focus:ring-primary",
          "transition-all duration-200 ease-in-out",
          
          // 尺寸和间距
          compact 
            ? "px-2 py-1 pr-6" 
            : "px-3 py-1.5 pr-8",
          
          // 背景和文字颜色
          "bg-background text-foreground",
          "dark:bg-card dark:text-foreground",
          
          // 边框样式
          "border-input dark:border-border",
          
          // 悬浮和焦点状态
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-background focus:text-foreground",
          
          // 禁用状态
          "disabled:opacity-50 disabled:cursor-not-allowed",
          
          // 确保下拉箭头可见
          "relative z-10"
        )}
        aria-label={intl.formatMessage({ id: 'language.select.label' })}
      >
        {SUPPORTED_LANGUAGES.map(({ value, label, flag }) => (
          <option 
            key={value} 
            value={value}
            aria-label={intl.formatMessage(
              { id: 'language.option.label' },
              { language: label }
            )}
          >
            {compact ? flag : `${flag} ${label}`}
          </option>
        ))}
      </select>

      {/* 自定义下拉箭头 */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
        aria-hidden="true"
      >
        <ChevronDown 
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            "h-4 w-4",
            "group-hover:text-accent-foreground"
          )} 
        />
      </div>

      {/* 无障碍提示（针对屏幕阅读器） */}
      <span className="sr-only">
        {intl.formatMessage(
          { id: 'language.current' },
          { language: currentLanguage?.label }
        )}
      </span>
    </div>
  );
}