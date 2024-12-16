import React from 'react';
import { useIntl } from 'react-intl';
import DashboardMetrics from "./dashboard/dashboard-metrics";
import MessageVolumeChart from "./dashboard/message-volume-chart";
import ActivityFeed from "./dashboard/activity-feed";
import BotStatusOverview from "./dashboard/bot-status-overview";

export default function MainContent() {
  const intl = useIntl();

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      {/* 页面标题区域 */}
      <div className="flex flex-col space-y-2 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          {intl.formatMessage({ id: 'dashboard.welcome.title' })}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {intl.formatMessage({ id: 'dashboard.welcome.description' })}
        </p>
      </div>

      <div className="space-y-8">
        {/* 关键指标部分 */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            {intl.formatMessage({ id: 'dashboard.section.keyMetrics' })}
          </h3>
          <DashboardMetrics />
        </div>

        {/* 图表和活动信息区域 */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            {intl.formatMessage({ id: 'dashboard.section.analyticsActivity' })}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <MessageVolumeChart />
            </div>
            <div className="lg:col-span-3">
              <ActivityFeed />
            </div>
          </div>
        </div>

        {/* 机器人状态概览部分 */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            {intl.formatMessage({ id: 'dashboard.section.botStatus' })}
          </h3>
          <BotStatusOverview />
        </div>
      </div>
    </div>
  );
}