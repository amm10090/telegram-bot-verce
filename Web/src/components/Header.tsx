// src/components/Header.tsx
import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useIntl } from 'react-intl';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const intl = useIntl();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* 左侧区域：汉堡菜单和标题 */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="
              lg:hidden
              p-2 rounded-md
              text-muted-foreground
              hover:text-foreground
              hover:bg-accent
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
            "
            aria-label={intl.formatMessage({ id: 'nav.toggle' })}
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="ml-4 text-lg font-medium text-foreground hidden md:block">
            {intl.formatMessage({ id: 'dashboard.title' })}
          </h1>
        </div>

        {/* 右侧工具栏 */}
        <div className="flex items-center space-x-4">
          {/* 语言切换器 */}
          <LanguageSwitcher />

          {/* 主题切换按钮 */}
          <ThemeToggle />

          {/* 通知按钮 */}
          <button 
            className="
              p-2 rounded-md
              text-muted-foreground
              hover:text-foreground
              hover:bg-accent
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
            "
            aria-label={intl.formatMessage({ id: 'notifications.toggle' })}
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* 用户头像按钮 */}
          <button 
            className="
              flex items-center justify-center
              h-8 w-8 rounded-full
              bg-accent
              hover:bg-accent/80
              transition-colors
            "
            aria-label={intl.formatMessage({ id: 'profile.open' })}
          >
            <User className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}