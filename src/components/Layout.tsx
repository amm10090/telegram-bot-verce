// src/components/Layout.tsx

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { 
  Home, 
  MessageCircle, 
  Settings, 
  User, 
  Bell,
  Menu 
} from 'lucide-react';

// 定义导航项的接口，使导航配置更加类型安全和可维护
interface NavItem {
  path: string;
  icon: React.ElementType;
  labelId: string;
}

// 定义组件的属性接口，明确组件可接收的配置项
interface LayoutProps {
  children: React.ReactNode;
  defaultSidebarState?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Layout 组件：应用程序的主要布局框架
 * 负责管理：
 * 1. 响应式侧边栏
 * 2. 顶部导航栏
 * 3. 内容区域布局
 * 4. 主题切换
 */
export default function Layout({
  children,
  defaultSidebarState = true,
  maxWidth = '2xl'
}: LayoutProps) {
  // 状态管理
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarState);
  const [isDesktopView, setIsDesktopView] = useState(false);
  const intl = useIntl();

  // 定义导航项配置
  const navigationItems: NavItem[] = [
    {
      path: '/',
      icon: Home,
      labelId: 'nav.dashboard'
    },
    {
      path: '/bots',
      icon: MessageCircle,
      labelId: 'nav.bots'
    },
    {
      path: '/settings',
      icon: Settings,
      labelId: 'nav.settings'
    }
  ];

  // 检测是否为桌面视图的辅助函数
  const isDesktop = useCallback(() => {
    return window.innerWidth >= 1024;
  }, []);

  // 响应式处理和侧边栏状态管理
  useEffect(() => {
    const handleResize = () => {
      const desktop = isDesktop();
      setIsDesktopView(desktop);
      
      // 在桌面视图时保持侧边栏展开
      if (desktop) {
        setSidebarOpen(true);
      }
    };

    // 初始化时执行一次
    handleResize();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 清理监听器
    return () => window.removeEventListener('resize', handleResize);
  }, [isDesktop]);

  // 处理侧边栏切换
  const toggleSidebar = useCallback(() => {
    if (!isDesktopView) {
      setSidebarOpen(prev => !prev);
    }
  }, [isDesktopView]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 侧边栏 */}
      <aside className={`
        fixed inset-y-0 left-0 z-40
        flex w-64 flex-col
        bg-card border-r border-border
        shadow-lg
        transition-transform duration-300 ease-in-out
        ${!isDesktopView && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* 侧边栏头部 */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <span className="text-xl font-semibold text-foreground">
            {intl.formatMessage({ id: 'app.title' })}
          </span>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.labelId}
                href={item.path}
                className="flex items-center px-4 py-2.5 rounded-md
                  text-muted-foreground
                  hover:text-foreground hover:bg-accent
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  transition-colors duration-200"
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-medium">
                  {intl.formatMessage({ id: item.labelId })}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* 移动端遮罩层 */}
      {!isDesktopView && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 主内容区域 */}
      <div className={`
        flex flex-col min-h-screen
        transition-all duration-300
        ${isDesktopView ? 'lg:ml-64' : 'lg:ml-0'}
      `}>
        {/* 顶部导航栏 */}
        <header className={`
          fixed top-0 z-30 w-full
          h-16 bg-card border-b border-border
          transition-all duration-300
          ${isDesktopView ? 'lg:w-[calc(100%-16rem)]' : 'lg:w-full'}
        `}>
          <div className="h-full px-6 flex items-center justify-between">
            {/* 左侧区域 */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md
                  text-muted-foreground
                  hover:bg-accent hover:text-accent-foreground
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  lg:hidden"
                aria-label={intl.formatMessage({ id: 'nav.toggle' })}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-medium text-foreground hidden md:block">
                {intl.formatMessage({ id: 'nav.dashboard' })}
              </h1>
            </div>

            {/* 右侧工具栏 */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />

              {/* 通知按钮 */}
              <button
                className="p-2 rounded-md
                  text-muted-foreground
                  hover:bg-accent hover:text-accent-foreground
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={intl.formatMessage({ id: 'notifications.toggle' })}
              >
                <Bell className="h-5 w-5" />
              </button>

              {/* 用户头像按钮 */}
              <button
                className="flex items-center justify-center
                  h-8 w-8 rounded-full
                  bg-accent
                  hover:bg-accent/80
                  transition-colors"
                aria-label={intl.formatMessage({ id: 'profile.open' })}
              >
                <User className="h-5 w-5 text-accent-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20">
          <div className={`container mx-auto ${maxWidth ? `max-w-${maxWidth}` : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}