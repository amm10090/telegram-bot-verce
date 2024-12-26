// src/contexts/LocaleContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import enUS from '../locales/en-US';
import zhCN from '../locales/zh-CN';

type SupportedLocales = 'en-US' | 'zh-CN';

// 定义消息字典
const messages = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

interface LocaleContextType {
  locale: SupportedLocales;
  setLocale: (locale: SupportedLocales) => void;
}

interface LocaleProviderProps {
  children: React.ReactNode;
  defaultLocale?: SupportedLocales;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
  children,
  defaultLocale = 'en-US'
}: LocaleProviderProps) {
  // 初始化使用默认语言
  const [locale, setLocale] = useState<SupportedLocales>(defaultLocale);

  // 在客户端加载时从 localStorage 获取语言设置
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('locale');
      if (savedLocale && (savedLocale === 'en-US' || savedLocale === 'zh-CN')) {
        setLocale(savedLocale);
      }
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
    }
  }, []);

  // 当语言改变时保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('locale', locale);
    } catch (error) {
      console.warn('Failed to save locale to localStorage:', error);
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider
        messages={messages[locale]}
        locale={locale}
        defaultLocale="en-US"
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}