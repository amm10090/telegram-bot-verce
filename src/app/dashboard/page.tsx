// src/app/dashboard/page.tsx
import React from 'react';
import { useIntl } from 'react-intl';
import DashboardMetrics from "../../components/dashboard/dashboard-metrics";
import MessageVolumeChart from "../../components/dashboard/message-volume-chart";
import ActivityFeed from "../../components/dashboard/activity-feed";
import BotStatusOverview from "../../components/dashboard/bot-status-overview";

export default function DashboardPage() {
  const intl = useIntl();

  return (
    <>
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
    </>
  );
}