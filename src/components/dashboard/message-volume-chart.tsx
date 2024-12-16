// src/components/message-volume-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIntl } from "react-intl"
import React from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "jan", value: 2400 },
  { month: "feb", value: 1398 },
  { month: "mar", value: 9800 },
  { month: "apr", value: 3908 },
  { month: "may", value: 4800 },
  { month: "jun", value: 3800 },
  { month: "jul", value: 4300 },
]

export default function MessageVolumeChart() {
  const intl = useIntl();

  // 格式化月份名称
  const formatMonth = (month: string) => {
    return intl.formatMessage({ id: `dashboard.chart.months.${month}` });
  };

  // 格式化数值
  const formatValue = (value: number) => {
    return intl.formatNumber(value);
  };

  // 自定义提示内容
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow">
          {intl.formatMessage(
            { id: "dashboard.chart.tooltip.messages" },
            { value: formatValue(payload[0].value) }
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>
          {intl.formatMessage({ id: "dashboard.chart.messageVolume" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="month" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatMonth}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}