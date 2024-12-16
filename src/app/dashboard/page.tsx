import { Metadata } from "next"
import DashboardMetrics from "@/components/dashboard/dashboard-metrics"
import MessageVolumeChart from "@/components/dashboard/message-volume-chart"
import ActivityFeed from "@/components/dashboard/activity-feed"
import BotStatusOverview from "@/components/dashboard/bot-status-overview"
import React from "react"

// 定义页面的元数据，如标题和描述
export const metadata: Metadata = {
  title: "仪表盘",
  description: "Telegram Bot 管理仪表盘",
}

export default function DashboardPage() {
  return (
    // flex-1 让这个容器占据剩余空间
    // space-y-4 在子元素之间添加间距
    // p-8 添加内边距
    // pt-6 顶部内边距特别设置
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* 页面标题区域 */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
      </div>

      {/* 关键指标部分 */}
      <DashboardMetrics />

      {/* 图表和活动信息区域，使用网格布局 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <MessageVolumeChart />
        <ActivityFeed />
      </div>

      {/* 机器人状态概览部分 */}
      <BotStatusOverview />
    </div>
  )
}