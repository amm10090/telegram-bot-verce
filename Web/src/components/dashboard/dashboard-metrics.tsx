// src/components/dashboard-metrics.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, Bot, AlertTriangle } from 'lucide-react'
import { useIntl } from "react-intl"
import React from "react"

const getMetricInfo = (intl: any) => [
  {
    id: "totalUsers",
    value: 10483,
    icon: Users,
  },
  {
    id: "messages",
    value: 45231,
    icon: MessageCircle,
  },
  {
    id: "activeBots",
    value: 24,
    icon: Bot,
  },
  {
    id: "errorRate",
    value: 0.12,
    icon: AlertTriangle,
    isPercentage: true,
  },
];

export default function DashboardMetrics() {
  const intl = useIntl();
  const metrics = getMetricInfo(intl);

  const formatValue = (value: number, isPercentage?: boolean) => {
    if (isPercentage) {
      return intl.formatNumber(value, { 
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return intl.formatNumber(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {intl.formatMessage({ id: `dashboard.metrics.${metric.id}` })}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(metric.value, metric.isPercentage)}
            </div>
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage({ id: `dashboard.metrics.${metric.id}.description` })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}