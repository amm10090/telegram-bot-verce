// 主题相关的类型定义

/**
 * 支持的主题类型
 * - light: 浅色主题
 * - dark: 深色主题
 * - system: 跟随系统设置
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * 主题上下文的类型定义
 */
export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

/**
 * 主题提供者组件的属性类型
 */
export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
}