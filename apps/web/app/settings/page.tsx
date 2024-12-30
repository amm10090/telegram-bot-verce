// src/app/settings/page.tsx
"use client"; // 添加客户端指令，因为我们使用了 hooks
import React from "react";
import { useIntl } from "react-intl";
import UserProfile from "@components/settings/user-profile";
import NotificationPreferences from "@components/settings/notification-preferences";
import ApiKeysManagement from "@components/settings/api-keys-management";
import SystemPreferences from "@components/settings/system-preferences";
import SecuritySettings from "@components/settings/security-settings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Toaster } from "@workspace/ui/components/toaster"

function SettingsContent() {
  const intl = useIntl();

  // 添加平滑滚动效果
  React.useEffect(() => {
    if (window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题和说明区域 - 添加了更好的间距和响应式设计 */}
      <section className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {intl.formatMessage({ id: "settings.title" })}
        </h1>
        <p className="text-muted-foreground text-lg">
          {intl.formatMessage({ id: "settings.description" })}
        </p>
      </section>

      {/* 设置内容区域 - 使用网格布局优化响应式显示 */}
      <div className="space-y-10">
        {/* 个人资料设置区域 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {intl.formatMessage({ id: "settings.section.profile" })}
          </h2>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {intl.formatMessage({ id: "settings.profile.title" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <UserProfile />
            </CardContent>
          </Card>
        </section>

        {/* 安全设置区域 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {intl.formatMessage({ id: "settings.section.security" })}
          </h2>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {intl.formatMessage({ id: "settings.security.title" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SecuritySettings />
            </CardContent>
          </Card>
        </section>

        {/* API密钥和通知设置区域 - 优化响应式布局 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {intl.formatMessage({ id: "settings.section.integrations" })}
          </h2>
          {/* 修改网格容器的样式 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API密钥管理卡片 - 优化内部布局 */}
            <div id="api-keys" className="min-w-0">
              {" "}
              {/* 添加 min-w-0 防止子元素溢出 */}
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">
                    {intl.formatMessage({ id: "settings.apiKeys.title" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ApiKeysManagement />
                </CardContent>
              </Card>
            </div>

            {/* 通知设置卡片 - 优化内部布局 */}
            <div className="min-w-0">
              {" "}
              {/* 添加 min-w-0 防止子元素溢出 */}
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">
                    {intl.formatMessage({ id: "settings.notifications.title" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NotificationPreferences />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 系统偏好设置区域 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {intl.formatMessage({ id: "settings.section.system" })}
          </h2>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {intl.formatMessage({ id: "settings.system.title" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SystemPreferences />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

// 导出组合后的设置页面组件
export default function SettingsPage() {
  return (
    <>
      <SettingsContent />
      <Toaster />
    </>
  );
}
