// src/components/Header.tsx
import React from 'react';
import { Menu, Bell, User, Search } from 'lucide-react'; // 添加 Search 图标用于搜索功能
import { useIntl } from 'react-intl';
import ThemeToggle from './ThemeToggle';
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      {/* 主要内容容器 */}
      <div className="
        flex h-14 sm:h-16 items-center justify-between
        px-3 sm:px-4 md:px-6 lg:px-8
        transition-all duration-300
      ">
        {/* 左侧区域：菜单按钮和标题 */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="
              inline-flex items-center justify-center
              h-9 w-9 sm:h-10 sm:w-10
              rounded-md
              text-muted-foreground
              hover:text-foreground hover:bg-accent
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              transition-colors duration-200
              lg:hidden
            "
            aria-label={intl.formatMessage({ id: 'nav.toggle' })}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* 标题区域 */}
          <div className="flex items-center space-x-3">
            <h1 className="
              text-base sm:text-lg md:text-xl
              font-semibold
              text-foreground
              truncate
            ">
              {intl.formatMessage({ id: 'dashboard.title' })}
            </h1>
          </div>
        </div>

        {/* 右侧工具栏 */}
        <div className="flex items-center">
          {/* 搜索框 - 桌面端显示 */}
          <div className="hidden md:flex items-center mr-4">
            <div className="
              relative
              w-48 lg:w-64 xl:w-80
              transition-all duration-300
            ">
              <input
                type="search"
                placeholder={intl.formatMessage({ id: 'search.placeholder' })}
                className="
                  w-full h-9
                  px-3 py-2
                  rounded-md
                  border border-input
                  bg-background
                  text-sm
                  placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring
                  transition-colors
                "
              />
              <Search className="
                absolute right-3 top-1/2 transform -translate-y-1/2
                h-4 w-4
                text-muted-foreground
                pointer-events-none
              "/>
            </div>
          </div>

          {/* 工具按钮组 */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* 语言切换器 - 平板和桌面端显示 */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* 主题切换器 - 平板和桌面端显示 */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* 通知按钮 */}
            <button className="
              flex items-center justify-center
              h-9 w-9 sm:h-10 sm:w-10
              rounded-md
              text-muted-foreground
              hover:text-foreground hover:bg-accent
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              transition-colors duration-200
            ">
              <Bell className="h-5 w-5" />
            </button>

            {/* 用户头像按钮 */}
            <button className="
              flex items-center justify-center
              h-8 w-8 sm:h-9 sm:w-9
              rounded-full
              bg-accent
              hover:bg-accent/80
              transition-colors duration-200
            ">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* 移动端搜索栏 */}
      <div className="block sm:hidden border-t border-border">
        <div className="px-3 py-2">
          <div className="relative">
            <input
              type="search"
              placeholder={intl.formatMessage({ id: 'search.placeholder' })}
              className="
                w-full h-9
                px-3 py-2
                rounded-md
                border border-input
                bg-background
                text-sm
                placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring
                transition-colors
              "
            />
            <Search className="
              absolute right-3 top-1/2 transform -translate-y-1/2
              h-4 w-4
              text-muted-foreground
              pointer-events-none
            "/>
          </div>
        </div>
      </div>
    </header>
  );
}