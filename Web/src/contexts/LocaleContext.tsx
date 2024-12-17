// src/contexts/LocaleContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { IntlProvider } from 'react-intl';
import enUS from '../locales/en-US';
import zhCN from '../locales/zh-CN';
import type { SupportedLocales } from '../types/locale';

// 定义消息字典
const messages: Record<SupportedLocales, any> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

interface LocaleContextType {
  locale: SupportedLocales;
  setLocale: (locale: SupportedLocales) => void;
}

// 创建上下文
export const LocaleContext = createContext<LocaleContextType>({
  locale: 'en-US',
  setLocale: () => null,
});

// 导出 useLocale hook
export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 从localStorage或浏览器设置获取初始语言
  const getInitialLocale = (): SupportedLocales => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && (savedLocale === 'en-US' || savedLocale === 'zh-CN')) {
      return savedLocale;
    }
    const browserLocale = navigator.language;
    return browserLocale.startsWith('zh') ? 'zh-CN' : 'en-US';
  };

  const [locale, setLocale] = useState<SupportedLocales>(getInitialLocale());

  // 保存语言设置到localStorage
  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const value = {
    locale,
    setLocale,
  };

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider
        messages={messages[locale]}
        locale={locale}
        defaultLocale="en-US"
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
};