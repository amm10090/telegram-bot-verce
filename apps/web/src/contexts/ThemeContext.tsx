import React, { createContext, useContext, useEffect, useState } from 'react';

// 定义支持的主题类型
type Theme = 'light' | 'dark' | 'system';

// 定义主题上下文的类型
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// 定义主题提供者的属性类型
interface ThemeProvider {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

// 创建主题上下文，提供默认值
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => null,
});

/**
 * 主题提供者组件
 * 负责管理主题状态并提供主题切换功能
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProvider) {
  // 从 localStorage 获取保存的主题，如果没有则使用默认主题
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || defaultTheme;
  });

  // 应用主题到 HTML 元素
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    // 根据主题设置类名
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
      
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [enableSystem, theme]);

  // 监听主题变化并更新
  useEffect(() => {
    // 保存主题到 localStorage
    localStorage.setItem('theme', theme);
    
    // 如果没有禁用过渡动画，添加过渡效果
    if (!disableTransitionOnChange) {
      document.documentElement.style.setProperty('--transition-duration', '200ms');
    }

    applyTheme(theme);
  }, [theme, disableTransitionOnChange]);

  // 首次加载时应用主题
  useEffect(() => {
    applyTheme(theme);
  }, []);

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
    throw new Error('useTheme 必须在 ThemeProvider 内部使用');
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