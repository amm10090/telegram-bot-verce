'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// 定义支持的主题类型
type Theme = 'light' | 'dark' | 'system';

// 定义主题上下文的类型
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// 定义主题提供者组件的参数类型
interface ThemeProviderProps {
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  children: React.ReactNode;
}

// 创建主题上下文，提供默认值
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 主题提供者组件
 * 负责管理主题状态并提供主题切换功能
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false
}: ThemeProviderProps) {
  // 从 localStorage 读取保存的主题设置
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          return savedTheme as Theme;
        }
      } catch (error) {
        console.warn('Failed to read theme from localStorage:', error);
      }
    }
    return defaultTheme;
  });
  
  // 应用主题到 HTML 元素
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  // 监听系统主题变化
  useEffect(() => {
    if (enableSystem && theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [enableSystem, theme]);

  // 当主题改变时应用
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      if (!disableTransitionOnChange) {
        document.documentElement.style.setProperty('--transition-duration', '200ms');
      }
      applyTheme(theme);
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }, [theme, disableTransitionOnChange]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 自定义钩子：使用主题
 * 提供一个便捷的方式来访问和修改主题
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * 实用函数：判断当前是否为深色模式
 */
export function useIsDarkMode() {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = 
      theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkMode);
  }, [theme]);

  return isDark;
}