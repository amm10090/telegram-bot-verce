// src/components/Layout.tsx
import React, { useState, useCallback } from 'react';
import { ThemeProvider } from 'next-themes';
import { useIntl } from 'react-intl';
import LanguageSwitcher from './LanguageSwitcher';
import Sidebar from './Sidebar';
import Header from './Header';
import { User, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

// 定义组件的属性类型
interface LayoutProps {
  children: React.ReactNode;
  defaultSidebarState?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function Layout({ 
  children, 
  defaultSidebarState = false,
  maxWidth = '2xl'
}: LayoutProps) {
  // 状态管理
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarState);
  const { theme, setTheme } = useTheme();
  const intl = useIntl();

  // 切换侧边栏的回调函数
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // 切换主题的回调函数
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeProvider attribute="class">
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* 侧边栏 */}
        <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Logo 区域 */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-gray-800 dark:text-white">
              {intl.formatMessage({ id: 'app.title', defaultMessage: 'TG Bot 管理面板' })}
            </span>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {/* 仪表盘链接 */}
              <a href="/" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                <Home className="mr-3 h-5 w-5" />
                <span>{intl.formatMessage({ id: 'nav.dashboard', defaultMessage: '仪表盘' })}</span>
              </a>

              {/* 机器人管理链接 */}
              <a href="/bots" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                <MessageCircle className="mr-3 h-5 w-5" />
                <span>{intl.formatMessage({ id: 'nav.bots', defaultMessage: '机器人' })}</span>
              </a>

              {/* 设置链接 */}
              <a href="/settings" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                <Settings className="mr-3 h-5 w-5" />
                <span>{intl.formatMessage({ id: 'nav.settings', defaultMessage: '设置' })}</span>
              </a>
            </div>
          </nav>
        </aside>

        {/* 主内容区域 */}
        <div className="lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
          {/* 顶部导航栏 */}
          <header className="h-16 bg-white dark:bg-gray-800 shadow-sm fixed w-full z-10 lg:w-[calc(100%-16rem)]">
            <div className="h-full px-6 flex items-center justify-between">
              {/* 左侧 - 汉堡菜单和标题 */}
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="ml-4 text-lg font-medium text-gray-800 dark:text-white">Dashboard</h1>
              </div>

              {/* 右侧工具栏 */}
              <div className="flex items-center space-x-4">
                {/* 语言切换器 */}
                <LanguageSwitcher />

                {/* 主题切换按钮 */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* 通知按钮 */}
                <button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="h-5 w-5" />
                </button>

                {/* 用户头像 */}
                <div className="relative">
                  <button className="flex items-center focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </button>
                </div>
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
    </ThemeProvider>
  );
}