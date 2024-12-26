"use client"

import React from 'react';
import { useIntl } from 'react-intl';
import DashboardMetrics from "@components/dashboard/dashboard-metrics";
import MessageVolumeChart from "@components/dashboard/message-volume-chart";
import ActivityFeed from "@components/dashboard/activity-feed";
import BotStatusOverview from "@components/dashboard/bot-status-overview";
import { Sparkles, ChevronRight } from 'lucide-react';

/**
 * 仪表盘页面组件
 * 负责展示整体数据概览和状态监控
 */
export default function DashboardPage() {
  // 使用 react-intl 进行国际化
  const intl = useIntl();

  return (
    // 主容器
    <div className="min-h-screen space-y-8 p-4 sm:p-6 lg:p-8 bg-background transition-all duration-300">
      {/* 欢迎区域 */}
      <section className="
        relative 
        rounded-xl 
        bg-gradient-to-r from-primary/10 via-primary/5 to-transparent 
        p-6 sm:p-8 
        border border-border/50
      ">
        {/* 装饰性图标 */}
        <div className="absolute top-0 right-0 p-3">
          <Sparkles className="h-5 w-5 text-primary/40" />
        </div>

        <div className="max-w-4xl">
          {/* 欢迎标题 */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            {intl.formatMessage({ id: 'dashboard.welcome.title' })}
          </h1>
          {/* 欢迎描述 */}
          <p className="mt-2 text-base sm:text-lg text-muted-foreground">
            {intl.formatMessage({ id: 'dashboard.welcome.description' })}
          </p>
        </div>
      </section>

      {/* 关键指标区域 */}
      <DashboardMetrics />

      {/* 图表和活动区域 */}
      <div className="grid gap-6 md:grid-cols-2">
        <MessageVolumeChart />
        <ActivityFeed />
      </div>

      {/* 机器人状态概览 */}
      <BotStatusOverview />
    </div>
  );
}