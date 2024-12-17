import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import type { SupportedLocales } from '../types/locale';
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocales)}
        className={cn(
          "appearance-none rounded-md px-3 py-1.5 pr-8 text-sm",
          "transition-colors duration-200 ease-in-out",
          "border focus:outline-none focus:ring-2 focus:ring-primary",
          // Light mode styles
          "bg-background border-input text-foreground",
          // Dark mode styles
          "dark:bg-card dark:border-border dark:text-foreground",
          // Hover styles
          "hover:bg-accent hover:text-accent-foreground"
        )}
        aria-label="选择语言"
      >
        <option value="en-US">English</option>
        <option value="zh-CN">中文</option>
      </select>
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg 
          className="h-4 w-4 text-muted-foreground" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </div>
    </div>
  );
}