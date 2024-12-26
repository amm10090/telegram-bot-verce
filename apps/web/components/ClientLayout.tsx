"use client"

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from '@contexts/ThemeContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { LocaleProvider } from '@contexts/LocaleContext';
import Sidebar from '@components/Sidebar';
import Header from '@components/Header';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// 错误边界组件
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-2xl font-bold mb-4">抱歉，出现了一些问题</h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  return children;
}

// 加载状态组件
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-2 text-foreground">加载中...</p>
      </div>
    </div>
  );
}

// 主布局组件
function MainLayout({ children }: ClientLayoutProps) {
  const { theme } = useTheme();
  const intl = useIntl();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktopView, setIsDesktopView] = useState(false);

  const checkIsDesktop = useCallback(() => {
    return window.innerWidth >= 1024;
  }, []);

  useEffect(() => {
    const updateViewState = () => {
      const isDesktop = checkIsDesktop();
      setIsDesktopView(isDesktop);
      
      if (isDesktop !== isDesktopView) {
        setSidebarOpen(isDesktop);
      }
    };

    updateViewState();
    window.addEventListener('resize', updateViewState);
    return () => window.removeEventListener('resize', updateViewState);
  }, [checkIsDesktop, isDesktopView]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
      />

      <div 
        className={`
          flex flex-col min-h-screen
          transition-all duration-300
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        `}
      >
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <ThemeProvider defaultTheme="system" enableSystem>
          <LocaleProvider>
            <MainLayout>{children}</MainLayout>
          </LocaleProvider>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  );
} 