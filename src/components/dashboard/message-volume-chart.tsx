// src/components/message-volume-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useIntl } from "react-intl"
import React from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// 模拟数据
// 在实际应用中，这些数据通常来自API或props
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
  // 使用react-intl的hook获取国际化功能
  const intl = useIntl();

  // 格式化月份名称：将月份代码转换为本地化的月份名称
  const formatMonth = (month: string) => {
    return intl.formatMessage({ id: `dashboard.chart.months.${month}` });
  };

  // 格式化数值：使用本地化设置格式化数字
  const formatValue = (value: number) => {
    return intl.formatNumber(value);
  };

  // 自定义提示框组件
  // active: 提示框是否激活
  // payload: 当前数据点的信息
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="
          bg-card 
          text-card-foreground 
          border border-border 
          shadow-lg 
          rounded-lg 
          p-3 
          text-sm
        ">
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
    <Card className="bg-card col-span-4">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          {intl.formatMessage({ id: "dashboard.chart.messageVolume" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <LineChart data={data}>
              {/* X轴配置 */}
              <XAxis 
                dataKey="month" 
                stroke="currentColor" // 使用当前文本颜色
                opacity={0.5} // 降低轴线透明度提高可读性
                fontSize={12}
                tickLine={false} // 隐藏刻度线
                axisLine={false} // 隐藏轴线
                tickFormatter={formatMonth} // 格式化刻度标签
                className="text-muted-foreground" // 使用主题的次要文本颜色
              />
              {/* Y轴配置 */}
              <YAxis 
                stroke="currentColor"
                opacity={0.5}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                className="text-muted-foreground"
              />
              {/* 提示框配置 */}
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ 
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 1,
                  strokeDasharray: '5 5',
                  opacity: 0.3
                }}
              />
              {/* 数据线配置 */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" // 使用主题的主要颜色
                strokeWidth={2}
                dot={{ // 数据点样式
                  fill: 'hsl(var(--card))',
                  strokeWidth: 2,
                  stroke: 'hsl(var(--primary))',
                  r: 4
                }}
                activeDot={{ // 激活状态的数据点样式
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                  r: 6
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}