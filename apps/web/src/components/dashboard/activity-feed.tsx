// src/components/activity-feed.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ScrollArea } from "@telegram-bot/ui"
import { useIntl } from "react-intl"
import React from "react"

// 活动数据接口定义
interface Activity {
  id: number;
  type: string;
  params: Record<string, any>;
  timestamp: {
    value: number;
    unit: string;
  };
}

// 示例活动数据
const activities: Activity[] = [
  { 
    id: 1, 
    type: "userJoined",
    params: { name: "John", botName: "Bot A" },
    timestamp: { value: 2, unit: "minutes" }
  },
    { 
    id: 2, 
    type: "userJoined",
    params: { name: "John", botName: "Bot A" },
    timestamp: { value: 2, unit: "minutes" }
  },
    { 
    id: 3, 
    type: "userJoined",
    params: { name: "John", botName: "Bot A" },
    timestamp: { value: 2, unit: "minutes" }
  },
  // ... 其他活动数据
];

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
  const formatActivityMessage = (activity: Activity) => {
    return intl.formatMessage(
      { id: `dashboard.activity.event.${activity.type}` },
      activity.params
    );
  };

  return (
    <Card className="
      col-span-full            /* 在小屏幕上占据全宽 */
      sm:col-span-2           /* 在小屏幕以上占据2列 */
      lg:col-span-3           /* 在大屏幕上占据3列 */
      h-full                  /* 充满父容器高度 */
      min-h-[400px]          /* 最小高度确保内容可见 */
      flex flex-col          /* 使用弹性布局让内容可伸缩 */
    ">
      <CardHeader className="
        space-y-1            /* 标题和描述之间的间距 */
        flex-none           /* 防止header被压缩 */
        px-4 sm:px-6        /* 响应式水平内边距 */
        py-4                /* 垂直内边距 */
      ">
        <CardTitle className="
          text-lg sm:text-xl    /* 响应式字体大小 */
          font-semibold
        ">
          {intl.formatMessage({ id: "dashboard.activity.title" })}
        </CardTitle>
        <CardDescription className="
          text-sm              /* 描述文字大小 */
          text-muted-foreground
        ">
          {intl.formatMessage({ id: "dashboard.activity.description" })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="
        flex-1              /* 让内容区域填充剩余空间 */
        p-0                /* 移除默认内边距 */
        overflow-hidden    /* 防止溢出 */
      ">
        <ScrollArea className="
          h-[calc(100%-2rem)]   /* 减去padding的高度 */
          w-full
          px-4 sm:px-6          /* 响应式水平内边距 */
        ">
          <div className="space-y-4 py-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="
                  flex items-start 
                  space-x-3 sm:space-x-4   /* 响应式间距 */
                  p-2 sm:p-3               /* 响应式内边距 */
                  rounded-lg
                  hover:bg-accent/50       /* 悬浮效果 */
                  transition-colors
                "
              >
                <div className="flex-1 min-w-0">  {/* 防止文本溢出 */}
                  <p className="
                    text-sm font-medium
                    truncate           /* 文本溢出时显示省略号 */
                  ">
                    {formatActivityMessage(activity)}
                  </p>
                  <p className="
                    text-xs 
                    text-muted-foreground
                    mt-1
                  ">
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