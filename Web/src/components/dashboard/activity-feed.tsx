// src/components/activity-feed.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIntl } from "react-intl"
import React from "react"

// 更改数据结构以支持翻译
const activities = [
  { 
    id: 1, 
    type: "userJoined",
    params: { name: "John", botName: "Bot A" },
    timestamp: { value: 2, unit: "minutes" }
  },
  { 
    id: 2, 
    type: "messagesProcessed",
    params: { name: "Bot B", count: 100 },
    timestamp: { value: 5, unit: "minutes" }
  },
  {
    id: 3,
    type: "error",
    params: { botName: "Bot C", errorMessage: "API timeout" },
    timestamp: { value: 10, unit: "minutes" }
  },
  // ... 其他活动数据使用类似的结构
]

export default function ActivityFeed() {
  const intl = useIntl();

  // 格式化时间戳的辅助函数
  const formatTimestamp = (time: { value: number; unit: string }) => {
    if (time.value === 0) {
      return intl.formatMessage({ id: "dashboard.activity.timeAgo.justNow" });
    }
    return intl.formatMessage(
      { id: `dashboard.activity.timeAgo.${time.unit}` },
      { count: time.value }
    );
  };

  // 格式化活动消息的辅助函数
  const formatActivityMessage = (activity: typeof activities[0]) => {
    return intl.formatMessage(
      { id: `dashboard.activity.event.${activity.type}` },
      activity.params
    );
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>
          {intl.formatMessage({ id: "dashboard.activity.title" })}
        </CardTitle>
        <CardDescription>
          {intl.formatMessage({ id: "dashboard.activity.description" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="w-full">
                  <p className="text-sm font-medium">
                    {formatActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}