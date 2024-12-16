// src/components/bot-status-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, CheckCircle, XCircle } from 'lucide-react'
import { useIntl } from "react-intl"
import React from "react"

const bots = [
  { id: 1, name: "Welcome Bot", status: "online", users: 1234, messages: 5678 },
  { id: 2, name: "Support Bot", status: "online", users: 987, messages: 3456 },
  { id: 3, name: "Quiz Bot", status: "offline", users: 567, messages: 2345 },
  { id: 4, name: "News Bot", status: "online", users: 890, messages: 4567 },
]

export default function BotStatusOverview() {
  const intl = useIntl();

  // 格式化数字的辅助函数
  const formatMetric = (type: 'users' | 'messages', value: number) => {
    return intl.formatMessage(
      { id: `dashboard.botStatus.metrics.${type}` },
      { count: intl.formatNumber(value) }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {intl.formatMessage({ id: "dashboard.botStatus.title" })}
        </CardTitle>
        <CardDescription>
          {intl.formatMessage({ id: "dashboard.botStatus.description" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {bots.map((bot) => (
            <Card key={bot.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{bot.name}</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant={bot.status === "online" ? "default" : "destructive"}>
                    {bot.status === "online" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {intl.formatMessage({ 
                      id: `dashboard.botStatus.status.${bot.status}` 
                    })}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>{formatMetric('users', bot.users)}</p>
                  <p>{formatMetric('messages', bot.messages)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}