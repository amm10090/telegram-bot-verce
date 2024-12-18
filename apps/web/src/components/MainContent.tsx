// src/components/MainContent.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../app/dashboard/page';
import BotManagementTable from '../app/bot/bot-management-table';
import SettingsPage from '@/app/settings/page';

export default function MainContent() {
  return (
    // 保留最基本的页面级样式
    <div className="min-h-screen bg-background">
      {/* 容器样式保留页面级响应式，控制整体布局和边距 */}
      <div className="container mx-auto  sm:px-6 lg:px-8">
        {/* Routes作为路由容器 */}
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
      </div>
    </div>
  );
}