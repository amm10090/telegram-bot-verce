// src/components/MainContent.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../app/dashboard/page';
import BotManagementTable from '../app/bot/bot-management-table';
import { useIntl } from 'react-intl';
import SettingsPage from '@/app/settings/page';

export default function MainContent() {
  const intl = useIntl();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-[5rem] space-y-8">
        {/* 
          MainContent 现在作为一个路由容器
          它决定在内容区域显示哪个具体的页面组件 
        */}
        <Routes>
          {/* 仪表盘页面 */}
          <Route 
            path="/" 
            element={<DashboardPage />} 
          />
          
          {/* 机器人管理页面 */}
          <Route 
            path="/bots" 
            element={<BotManagementTable />} 
          />
                    {/* 设置页面 */}

        <Route path="/settings" element={<SettingsPage />} /> 
           {/* 未来可以在这里添加更多路由 */}

        </Routes>
      </div>
    </div>
  );
}