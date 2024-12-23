// src/components/MainContent.tsx
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// 使用 React.lazy() 动态导入组件
const DashboardPage = React.lazy(() => import('../app/dashboard/page'));
const BotManagementTable = React.lazy(() => import('../app/bot/bot-management-table'));
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
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 仪表盘路由 */}
        <Route 
          path="/" 
          element={<DashboardPage />} 
        />
        
        {/* 机器人管理路由 */}
        <Route 
          path="/bots" 
          element={<BotManagementTable />} 
        />
        
        {/* 设置页面路由 */}
        <Route 
          path="/settings" 
          element={<SettingsPage />} 
        />
      </Routes>
    </Suspense>
  );
}