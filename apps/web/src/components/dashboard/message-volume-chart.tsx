// src/components/message-volume-chart.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@telegram-bot/ui";
import { useIntl } from "react-intl";
import React, { useState, useCallback, useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

// 定义数据点的接口
interface DataPoint {
  month: string;
  value: number;
  trend?: number; // 环比增长率
}

// 扩展数据，添加环比增长信息
const processData = (rawData: DataPoint[]): DataPoint[] => {
  return rawData.map((item, index) => ({
    ...item,
    trend:
      index > 0
        ? ((item.value - rawData[index - 1].value) / rawData[index - 1].value) *
          100
        : 0,
  }));
};

// 示例数据
const rawData = [
  { month: "jan", value: 2400 },
  { month: "feb", value: 1398 },
  { month: "mar", value: 9800 },
  { month: "apr", value: 3908 },
  { month: "may", value: 4800 },
  { month: "jun", value: 3800 },
  { month: "jul", value: 4300 },
];

export default function MessageVolumeChart() {
  const intl = useIntl();
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // 处理数据，添加环比增长信息
  const data = useMemo(() => processData(rawData), []);

  // 获取最大值和最小值用于设置y轴范围
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const valueRange = maxValue - minValue;

  // 格式化月份名称
  const formatMonth = useCallback(
    (month: string) => {
      return intl.formatMessage({ id: `dashboard.chart.months.${month}` });
    },
    [intl]
  );

  // 格式化数值
  const formatValue = useCallback(
    (value: number) => {
      return intl.formatNumber(value, {
        notation: value > 9999 ? "compact" : "standard",
        maximumFractionDigits: 1,
      });
    },
    [intl]
  );

  // 自定义提示框组件
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentData = data.find((d) => d.month === label);
      const trend = currentData?.trend ?? 0;

      return (
        <div
          className="
          bg-card 
          border border-border 
          rounded-lg 
          shadow-lg 
          p-3
          space-y-2
        "
        >
          <div className="text-sm font-medium">{formatMonth(label)}</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">
                {intl.formatMessage({ id: "dashboard.chart.tooltip.messages" })}
                :
              </span>
              <span className="font-medium">
                {formatValue(payload[0].value)}
              </span>
            </div>
            {trend !== 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">
                  {intl.formatMessage({ id: "dashboard.chart.tooltip.trend" })}:
                </span>
                <span
                  className={`
                  font-medium
                  ${
                    trend > 0
                      ? "text-green-500"
                      : trend < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }
                `}
                >
                  {trend > 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      className="
      col-span-full
      lg:col-span-4
      h-[400px]
      bg-card
    "
    >
      <CardHeader
        className="
        space-y-1
        px-6 py-4
      "
      >
        <CardTitle
          className="
          text-xl font-semibold
          tracking-tight
        "
        >
          {intl.formatMessage({ id: "dashboard.chart.messageVolume" })}
        </CardTitle>
        <p
          className="
          text-sm
          text-muted-foreground
        "
        >
          {intl.formatMessage({ id: "dashboard.chart.description" })}
        </p>
      </CardHeader>

      <CardContent
        className="
        px-6 pb-6
        h-[calc(100%-5rem)]  /* 减去 header 的高度 */
      "
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            onMouseMove={(e) => {
              if (e.activeLabel) {
                setActiveMonth(e.activeLabel);
              }
            }}
            onMouseLeave={() => setActiveMonth(null)}
          >
            {/* 网格线 */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />

            {/* X轴配置 */}
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatMonth}
              dy={10}
            />

            {/* Y轴配置 */}
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
              domain={[
                minValue - valueRange * 0.1, // 下限留出10%空���
                maxValue + valueRange * 0.1, // 上限留出10%空间
              ]}
            />

            {/* 提示框 */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "hsl(var(--primary))",
                strokeWidth: 1,
                strokeDasharray: "5 5",
                opacity: 0.3,
              }}
            />

            {/* 图例 */}
            <Legend verticalAlign="top" height={36} />

            {/* 数据线 */}
            <Line
              type="monotone"
              dataKey="value"
              name={intl.formatMessage({
                id: "dashboard.chart.legend.messages",
              })}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{
                fill: "hsl(var(--background))",
                strokeWidth: 2,
                r: 4,
                stroke: "hsl(var(--primary))",
              }}
              activeDot={{
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
