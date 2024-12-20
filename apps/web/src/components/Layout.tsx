// src/components/Layout.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../contexts/ThemeContext';

// 定义布局组件的属性接口
interface LayoutProps {
  // 子组件，可以是任何有效的 React 节点
  children: React.ReactNode;
  // 控制侧边栏的默认显示状态
  defaultSidebarState?: boolean;
}

/**
 * 主布局组件
 * 负责管理整个应用的页面结构和响应式布局
 */
export default function Layout({
  children,
  defaultSidebarState = true,
}: LayoutProps) {
  // 获取主题和国际化工具
  const { theme } = useTheme();
  const intl = useIntl();

  // 状态管理
  // 控制侧边栏的开关状态
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarState);
  // 判断是否为桌面视图
  const [isDesktopView, setIsDesktopView] = useState(false);

  // 检查是否为桌面视图的函数
  // 使用 useCallback 来缓存函数，避免不必要的重新创建
  const checkIsDesktop = useCallback(() => {
    // 将 1024px 作为桌面视图的断点
    return window.innerWidth >= 1024;
  }, []);

  // 处理窗口大小变化的副作用
  useEffect(() => {
    // 更新视图状态的函数
    const updateViewState = () => {
      const isDesktop = checkIsDesktop();
      setIsDesktopView(isDesktop);
      
      // 仅在视图模式发生变化时更新侧边栏状态
      if (isDesktop !== isDesktopView) {
        setSidebarOpen(isDesktop);
      }
    };

    // 初始化时执行一次
    updateViewState();

    // 添加窗口大小变化的事件监听
    window.addEventListener('resize', updateViewState);

    // 清理函数，移除事件监听
    return () => window.removeEventListener('resize', updateViewState);
  }, [checkIsDesktop, isDesktopView]);

  return (
    // 整体容器，设置最小高度和背景色
    <div className="min-h-screen bg-background">
      {/* 侧边栏组件 */}
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
      />

      {/* 主内容区域容器 */}
      <div 
        className={`
          flex flex-col min-h-screen
          transition-all duration-300
          ${isDesktopView ? 'lg:pl-64' : ''} // 桌面视图时为侧边栏预留空间
        `}
      >
        {/* 顶部导航栏 */}
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDesktopView={isDesktopView}
        />

        {/* 主要内容区域 */}
 <main className="flex-1">
  {/* 内容容器 - 调整边距和宽度控制 */}
  <div className="
    w-full 
    px-4 
    sm:px-6 
    lg:px-8 
    py-4 
    sm:py-6 
    lg:py-8
  ">
    {children}
  </div>
</main>
      </div>
    </div>
  );
}