// src/components/MainContent.tsx
import React from 'react';
import { useIntl } from 'react-intl';
import DashboardMetrics from "./dashboard/dashboard-metrics";
import MessageVolumeChart from "./dashboard/message-volume-chart";
import ActivityFeed from "./dashboard/activity-feed";
import BotStatusOverview from "./dashboard/bot-status-overview";

export default function MainContent() {
  const intl = useIntl();

  return (
    <div className="min-h-screen bg-background">
      {/* 添加一个外层容器来处理内容的间距
          pt-[5rem] 确保内容不会被顶部导航栏遮挡
          空间布局采用 space-y 而不是固定 margin，使布局更加灵活 */}
      <div className="container mx-auto px-4 pt-[5rem] space-y-8">
        {/* 欢迎区域 */}
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {intl.formatMessage({ id: 'dashboard.welcome.title' })}
          </h1>
          <p className="text-muted-foreground">
            {intl.formatMessage({ id: 'dashboard.welcome.description' })}
          </p>
        </section>

        {/* 关键指标区域 */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">
            {intl.formatMessage({ id: 'dashboard.section.keyMetrics' })}
          </h2>
          <DashboardMetrics />
        </section>

        {/* 数据分析与活动区域 */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">
            {intl.formatMessage({ id: 'dashboard.section.analyticsActivity' })}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <MessageVolumeChart />
            </div>
            <div className="lg:col-span-3">
              <ActivityFeed />
            </div>
          </div>
        </section>

        {/* 机器人状态区域 */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">
            {intl.formatMessage({ id: 'dashboard.section.botStatus' })}
          </h2>
          <BotStatusOverview />
        </section>
      </div>
    </div>
  );
}