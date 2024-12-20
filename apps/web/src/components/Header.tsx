// src/components/Header.tsx
import React from 'react';
import { Menu, Bell, User, Search, Moon, Sun } from 'lucide-react';
import { useIntl } from 'react-intl';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';

// 定义组件的属性接口
interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDesktopView: boolean;
}

export default function Header({ 
  sidebarOpen, 
  setSidebarOpen,
  isDesktopView 
}: HeaderProps) {
  const intl = useIntl();
  const { theme, setTheme } = useTheme();

  // 主题切换按钮组件
  const ThemeToggle = () => (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-md 
                text-muted-foreground hover:text-foreground hover:bg-accent
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                transition-colors duration-200"
      aria-label={intl.formatMessage({ 
        id: theme === 'light' ? 'theme.dark' : 'theme.light' 
      })}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* 主要内容容器 */}
      <div className="flex h-14 sm:h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* 左侧区域：菜单按钮和标题 */}
        <div className="flex items-center gap-4">
          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-md
                     text-muted-foreground hover:text-foreground hover:bg-accent
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                     transition-colors duration-200"
            aria-label={intl.formatMessage({ id: 'nav.toggle' })}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* 标题 */}
          <h1 className="text-lg font-semibold text-foreground">
            {intl.formatMessage({ id: 'dashboard.title' })}
          </h1>
        </div>

        {/* 右侧工具栏 */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {/* 搜索框 - 桌面端显示 */}
          <div className="hidden md:block relative w-full max-w-[20rem] lg:max-w-[24rem]">
            <input
              type="search"
              placeholder={intl.formatMessage({ id: 'search.placeholder' })}
              className="w-full h-9 px-3 pl-9 rounded-md border border-input bg-transparent
                       placeholder:text-muted-foreground focus:outline-none focus:ring-2
                       focus:ring-ring transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 
                             text-muted-foreground pointer-events-none" />
          </div>

          {/* 工具按钮组 */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <button className="flex items-center justify-center h-9 w-9 rounded-md
                             text-muted-foreground hover:text-foreground hover:bg-accent
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                             transition-colors duration-200"
                    aria-label={intl.formatMessage({ id: 'notifications' })}>
              <Bell className="h-5 w-5" />
            </button>

            <button className="flex items-center justify-center h-8 w-8 rounded-full
                             bg-accent hover:bg-accent/80 transition-colors duration-200"
                    aria-label={intl.formatMessage({ id: 'profile' })}>
              <User className="h-4 w-4 text-accent-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* 移动端搜索栏 */}
      <div className="border-t border-border md:hidden p-4">
        <div className="relative">
          <input
            type="search"
            placeholder={intl.formatMessage({ id: 'search.placeholder' })}
            className="w-full h-9 px-3 pl-9 rounded-md border border-input bg-transparent
                     placeholder:text-muted-foreground focus:outline-none focus:ring-2
                     focus:ring-ring transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 
                           text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </header>
  );
}