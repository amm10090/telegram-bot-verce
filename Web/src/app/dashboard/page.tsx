// src/app/dashboard/page.tsx
import React from 'react';
import { useIntl } from 'react-intl';
import DashboardMetrics from "../../components/dashboard/dashboard-metrics";
import MessageVolumeChart from "../../components/dashboard/message-volume-chart";
import ActivityFeed from "../../components/dashboard/activity-feed";
import BotStatusOverview from "../../components/dashboard/bot-status-overview";
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
      <section className="space-y-4">
        {/* 标题区域 */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {intl.formatMessage({ id: 'dashboard.section.keyMetrics' })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'dashboard.section.keyMetrics.description' })}
            </p>
          </div>

          {/* 时间范围选择器 */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>过去 30 天</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        {/* 关键指标展示 */}
        <DashboardMetrics />
      </section>

      {/* 数据分析与活动区域 */}
      <section className="space-y-6">
        {/* 标题区域 */}
        <div className="px-1">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {intl.formatMessage({ id: 'dashboard.section.analyticsActivity' })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'dashboard.section.analyticsActivity.description' })}
          </p>
        </div>

        {/* 图表和活动信息区域 */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 min-h-[600px]">
          {/* 消息量趋势图表 */}
          <div className="lg:col-span-2 min-h-[400px]">
            <MessageVolumeChart />
          </div>
          {/* 实时活动信息流 */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </section>

      {/* 机器人状态区域 */}
      <section className="space-y-6">
        {/* 标题区域 */}
        <div className="px-1">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {intl.formatMessage({ id: 'dashboard.section.botStatus' })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {intl.formatMessage({ id: 'dashboard.section.botStatus.description' })}
          </p>
        </div>

        {/* 机器人状态概览 */}
        <div className="grid gap-6">
          <BotStatusOverview />
        </div>
      </section>
    </div>
  );
}