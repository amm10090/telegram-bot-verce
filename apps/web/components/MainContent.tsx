// src/components/MainContent.tsx
'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';

// 使用 Next.js 的动态导入
const DashboardPage = React.lazy(() => import('@/app/dashboard/page'));
const BotManagementTable = React.lazy(() => import('@/app/bots/page'));
const SettingsPage = React.lazy(() => import('@/app/settings/page'));

// 创建加载时的占位组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse text-lg text-gray-600">
      加载中...
    </div>
  </div>
);

export default function MainContent() {
  const pathname = usePathname();

  return (
    <Suspense fallback={<LoadingFallback />}>
      {pathname === '/' && <DashboardPage />}
      {pathname === '/bots' && <BotManagementTable />}
      {pathname === '/settings' && <SettingsPage />}
    </Suspense>
  );
}