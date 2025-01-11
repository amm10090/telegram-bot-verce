'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// 定义支持的主题类型
type Theme = 'light' | 'dark' | 'system';

// 定义主题上下文的类型
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onThemeChange?: (theme: Theme) => void;
}

// 定义主题提供者组件的参数类型
interface ThemeProviderProps {
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  children: React.ReactNode;
  onThemeChange?: (theme: Theme) => void;
}

// 创建主题上下文，提供默认值
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 添加主题配置常量
const THEME_CONFIG = {
  transitionDuration: '400ms',
  transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',
  storageKey: 'theme',
} as const;

// 添加主题预加载脚本
const themeScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('${THEME_CONFIG.storageKey}');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(
        savedTheme === 'dark' || (savedTheme === 'system' && systemTheme === 'dark') ? 'dark' : 'light'
      );
    } catch (e) {
      console.warn('主题预加载失败:', e);
    }
  })();
`;

/**
 * 主题提供者组件
 * 负责管理主题状态并提供主题切换功能
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
  onThemeChange
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
    
    // 使用统一的过渡配置
    root.style.setProperty('--transition-duration', THEME_CONFIG.transitionDuration);
    root.style.setProperty('--transition-timing', THEME_CONFIG.transitionTiming);
    
    // 为所有可能变化的属性添加过渡
    root.style.transition = `
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing),
      border-color var(--transition-duration) var(--transition-timing),
      fill var(--transition-duration) var(--transition-timing),
      stroke var(--transition-duration) var(--transition-timing),
      opacity var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing)
    `;

    root.classList.remove('light', 'dark');

    const resolvedTheme = newTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme;
    
    root.classList.add(resolvedTheme);
    onThemeChange?.(resolvedTheme);

    // 清理过渡效果
    setTimeout(() => {
      root.style.transition = '';
    }, parseInt(THEME_CONFIG.transitionDuration));
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
      localStorage.setItem(THEME_CONFIG.storageKey, theme);
      if (!disableTransitionOnChange) {
        applyTheme(theme);
      }
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }, [theme, disableTransitionOnChange]);

  // 添加主题预加载脚本
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = themeScript;
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, onThemeChange }}>
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

// 新增实用函数: 获取当前实际应用的主题
export function useResolvedTheme() {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme as 'light' | 'dark'
  );

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  return resolvedTheme;
}