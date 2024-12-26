// src/components/bot-status-overview.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Bot, CheckCircle, XCircle, Users, MessageCircle } from "lucide-react";
import { useIntl } from "react-intl";
import React from "react";

// 定义机器人数据接口，提高代码可维护性
interface BotData {
  id: number;
  name: string;
  status: "online" | "offline";
  users: number;
  messages: number;
}

// 示例数据
const bots: BotData[] = [
  { id: 1, name: "Welcome Bot", status: "online", users: 1234, messages: 5678 },
  { id: 2, name: "Support Bot", status: "online", users: 987, messages: 3456 },
  { id: 3, name: "Quiz Bot", status: "offline", users: 567, messages: 2345 },
  { id: 4, name: "News Bot", status: "online", users: 890, messages: 4567 },
];

export default function BotStatusOverview() {
  const intl = useIntl();

  // 格式化数字的辅助函数
  const formatMetric = (type: "users" | "messages", value: number) => {
    return intl.formatMessage(
      { id: `dashboard.botStatus.metrics.${type}` },
      { count: intl.formatNumber(value) }
    );
  };

  // 获取状态对应的颜色样式
  const getStatusColor = (status: BotData["status"]) => {
    return status === "online"
      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      : "bg-red-500/10 text-red-500 hover:bg-red-500/20";
  };

  return (
    <Card
      className="
      col-span-full              /* 移动端占满宽度 */
      transition-all duration-300 /* 平滑过渡效果 */
      hover:shadow-md            /* 悬浮时增加阴影 */
    "
    >
      <CardHeader
        className="
        space-y-1 sm:space-y-2    /* 响应式垂直间距 */
        px-4 sm:px-6              /* 响应式水平内边距 */
      "
      >
        <CardTitle
          className="
          text-xl sm:text-2xl      /* 响应式标题大小 */
          font-semibold
          tracking-tight           /* 字母间距 */
        "
        >
          {intl.formatMessage({ id: "dashboard.botStatus.title" })}
        </CardTitle>
        <CardDescription
          className="
          text-sm sm:text-base     /* 响应式描述文字大小 */
          text-muted-foreground
        "
        >
          {intl.formatMessage({ id: "dashboard.botStatus.description" })}
        </CardDescription>
      </CardHeader>

      <CardContent
        className="
        p-4 sm:p-6                /* 响应式内边距 */
      "
      >
        <div
          className="
          grid                    /* 使用网格布局 */
          gap-4                   /* 网格间距 */
          grid-cols-1             /* 移动端单列 */
          sm:grid-cols-2          /* 平板双列 */
          lg:grid-cols-4          /* 桌面四列 */
        "
        >
          {bots.map((bot) => (
            <Card
              key={bot.id}
              className="
                group               /* 用于子元素hover效果 */
                transition-all
                duration-300
                hover:shadow-md
                dark:hover:shadow-accent/10
              "
            >
              <CardHeader
                className="
                flex flex-row 
                items-center 
                justify-between 
                space-y-0 
                pb-2
                px-4 pt-4           /* 统一内边距 */
              "
              >
                <CardTitle
                  className="
                  text-sm font-medium
                  group-hover:text-primary  /* 父元素悬浮时变色 */
                  transition-colors
                "
                >
                  {bot.name}
                </CardTitle>
                <Bot
                  className="
                  h-4 w-4 
                  text-muted-foreground
                  group-hover:text-primary
                  transition-colors
                "
                />
              </CardHeader>

              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {/* 状态标签 */}
                  <Badge
                    className={`
                      ${getStatusColor(bot.status)}
                      transition-colors
                      px-2 py-1
                      rounded-md
                      text-xs
                      font-medium
                    `}
                  >
                    {bot.status === "online" ? (
                      <CheckCircle className="mr-1 h-3 w-3 inline" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3 inline" />
                    )}
                    {intl.formatMessage({
                      id: `dashboard.botStatus.status.${bot.status}`,
                    })}
                  </Badge>

                  {/* 指标信息 */}
                  <div
                    className="
                    grid grid-cols-2 
                    gap-2
                    pt-2
                    text-sm
                  "
                  >
                    {/* 用户数量 */}
                    <div
                      className="
                      flex items-center 
                      space-x-2
                      text-muted-foreground
                    "
                    >
                      <Users className="h-4 w-4" />
                      <span className="font-medium">
                        {intl.formatNumber(bot.users)}
                      </span>
                    </div>

                    {/* 消息数量 */}
                    <div
                      className="
                      flex items-center 
                      space-x-2
                      text-muted-foreground
                    "
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="font-medium">
                        {intl.formatNumber(bot.messages)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
