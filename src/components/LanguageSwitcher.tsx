// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import type { SupportedLocales } from '../types/locale';  // 我们会创建这个类型文件

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="relative inline-block">
<select
  value={locale}
  onChange={(e) => setLocale(e.target.value as SupportedLocales)}
  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 pr-8 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
  aria-label="选择语言"
>
  <option value="en-US">English</option>
  <option value="zh-CN">中文</option>
</select>
      {/* 添加一个自定义的下拉箭头 */}
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}