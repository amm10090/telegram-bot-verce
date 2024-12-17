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

  // 检测视窗大小的函数
  const checkIsDesktop = useCallback(() => {
    return window.innerWidth >= 1024;
  }, []);

  // 处理视窗大小变化
  useEffect(() => {
    // 初始化检查
    const updateViewState = () => {
      const isDesktop = checkIsDesktop();
      setIsDesktopView(isDesktop);
      
      // 只在视图模式发生变化时更新侧边栏状态
      if (isDesktop !== isDesktopView) {
        setSidebarOpen(isDesktop);
      }
    };

    // 首次执行
    updateViewState();

    // 添加事件监听器
    window.addEventListener('resize', updateViewState);

    // 清理函数
    return () => window.removeEventListener('resize', updateViewState);
  }, [checkIsDesktop, isDesktopView]);

  // 处理侧边栏切换
  const toggleSidebar = useCallback(() => {
    if (!isDesktopView) {
      setSidebarOpen(prev => !prev);
    }
  }, [isDesktopView]);

  return (
    <div className="min-h-screen bg-background">
      {/* 侧边栏 */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40
          w-[240px] md:w-64 lg:w-72
          flex flex-col
          bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isDesktopView ? 'lg:translate-x-0' : ''}
        `}
      >
        {/* 侧边栏头部 */}
        <div className="h-16 flex items-center px-4 md:px-6 border-b border-border">
          <span className="text-lg md:text-xl font-semibold truncate">
            {intl.formatMessage({ id: 'app.title' })}
          </span>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.labelId}
                href={item.path}
                className="
                  flex items-center px-3 md:px-4 py-2 md:py-2.5
                  text-sm md:text-base
                  text-muted-foreground
                  hover:text-foreground hover:bg-accent
                  rounded-md
                  transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-ring
                "
              >
                <item.icon className="h-5 w-5 mr-3 shrink-0" />
                <span className="font-medium truncate">
                  {intl.formatMessage({ id: item.labelId })}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* 遮罩层 - 仅在移动端且侧边栏打开时显示 */}
      {!isDesktopView && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 主内容区域 */}
      <div 
        className={`
          flex flex-col min-h-screen
          transition-all duration-300
          ${isDesktopView ? 'lg:pl-[240px] xl:pl-72' : ''}
        `}
      >
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