// src/components/MainContent.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../app/dashboard/page';
import BotManagementTable from '../app/bot/bot-management-table';
import SettingsPage from '@/app/settings/page';

export default function MainContent() {
  return (
    // 保留最基本的页面级样式
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

  );
}