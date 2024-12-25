// src/components/dashboard-metrics.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@telegram-bot/ui";
import { Users, MessageCircle, Bot, AlertTriangle } from "lucide-react";
import { useIntl } from "react-intl";
import React from "react";

// 定义指标数据的类型接口
interface MetricInfo {
  id: string;
  value: number;
  icon: React.ElementType;
  isPercentage?: boolean;
  trend?: {
    direction: "up" | "down";
    value: number;
  };
  color?: string;
}

/**
 * 趋势指标组件
 * 用于展示指标的增长或下降趋势
 */
const TrendIndicator = ({
  direction,
  value,
  className = "",
}: {
  direction: "up" | "down";
  value: number;
  className?: string;
}) => {
  const isPositive = direction === "up";
  const textColor = isPositive ? "text-green-500" : "text-red-500";

  return (
    <span
      className={`
      inline-flex items-center
      ${textColor}
      text-xs sm:text-sm
      font-medium
      ${className}
    `}
    >
      <svg
        className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${
          isPositive ? "" : "transform rotate-180"
        }`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M5 15l7-7 7 7" />
      </svg>
      {value}%
    </span>
  );
};

/**
 * 获取指标数据的函数
 * 返回包含所有关键指标信息的数组
 */
const getMetricInfo = (intl: any): MetricInfo[] => [
  {
    id: "totalUsers",
    value: 10483,
    icon: Users,
    color: "blue",
    trend: {
      direction: "up",
      value: 2.5,
    },
  },
  {
    id: "messages",
    value: 45231,
    icon: MessageCircle,
    color: "green",
    trend: {
      direction: "up",
      value: 3.2,
    },
  },
  {
    id: "activeBots",
    value: 24,
    icon: Bot,
    color: "purple",
    trend: {
      direction: "down",
      value: 1.1,
    },
  },
  {
    id: "errorRate",
    value: 0.12,
    icon: AlertTriangle,
    color: "red",
    isPercentage: true,
    trend: {
      direction: "down",
      value: 0.8,
    },
  },
];

/**
 * 仪表盘指标组件
 * 展示关键业务指标和趋势
 */
export default function DashboardMetrics() {
  // 使用 react-intl 进行国际化
  const intl = useIntl();
  // 获取指标数据
  const metrics = getMetricInfo(intl);

  /**
   * 格式化数值的辅助函数
   * 处理百分比和大数字的显示格式
   */
  const formatValue = (value: number, isPercentage?: boolean) => {
    if (isPercentage) {
      return intl.formatNumber(value, {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return intl.formatNumber(value, {
      notation: value > 9999 ? "compact" : "standard",
      maximumFractionDigits: 1,
    });
  };

  /**
   * 获取颜色样式的辅助函数
   * 根据指标类型返回对应的渐变颜色类
   */
  const getColorClasses = (color: string = "blue") => {
    const colors = {
      blue: "from-blue-500/10 via-blue-500/5 to-transparent hover:from-blue-500/20",
      green:
        "from-green-500/10 via-green-500/5 to-transparent hover:from-green-500/20",
      purple:
        "from-purple-500/10 via-purple-500/5 to-transparent hover:from-purple-500/20",
      red: "from-red-500/10 via-red-500/5 to-transparent hover:from-red-500/20",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    // 指标卡片网格容器
    <div
      className="
      grid
      gap-4
      grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
      auto-rows-fr
    "
    >
      {/* 遍历渲染指标卡片 */}
      {metrics.map((metric) => (
        <Card
          key={metric.id}
          className="
            relative
            overflow-hidden
            border border-border/50
            bg-card
            hover:shadow-lg
            hover:border-border
            transition-all
            duration-300
          "
        >
          {/* 背景渐变效果 */}
          <div
            className={`
            absolute inset-0
            bg-gradient-to-br
            ${getColorClasses(metric.color)}
            transition-all duration-300
          `}
          />

          {/* 卡片内容 */}
          <div className="relative z-10">
            {/* 卡片头部 */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                {intl.formatMessage({ id: `dashboard.metrics.${metric.id}` })}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            {/* 卡片内容 */}
            <CardContent>
              <div className="space-y-2">
                {/* 主要数值 */}
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {formatValue(metric.value, metric.isPercentage)}
                </div>

                {/* 描述和趋势 */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {intl.formatMessage({
                      id: `dashboard.metrics.${metric.id}.description`,
                    })}
                  </p>
                  {metric.trend && (
                    <TrendIndicator
                      direction={metric.trend.direction}
                      value={metric.trend.value}
                      className="flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}
