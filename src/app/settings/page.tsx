// src/app/settings/page.tsx
import React from 'react';
import { useIntl } from 'react-intl';
import UserProfile from "@/components/settings/user-profile";
import NotificationPreferences from "@/components/settings/notification-preferences";
import ApiKeysManagement from "@/components/settings/api-keys-management";
import SystemPreferences from "@/components/settings/system-preferences";
import SecuritySettings from "@/components/settings/security-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const intl = useIntl();

  return (
    <div className="space-y-8">
      {/* 页面标题和说明区域 */}
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          {intl.formatMessage({ id: 'settings.title' })}
        </h1>
        <p className="text-muted-foreground">
          {intl.formatMessage({ id: 'settings.description' })}
        </p>
      </section>

      {/* 个人资料设置区域 */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          {intl.formatMessage({ id: 'settings.section.profile' })}
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>
              {intl.formatMessage({ id: 'settings.profile.title' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserProfile />
          </CardContent>
        </Card>
      </section>

      {/* 安全设置区域 */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          {intl.formatMessage({ id: 'settings.section.security' })}
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>
              {intl.formatMessage({ id: 'settings.security.title' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SecuritySettings />
          </CardContent>
        </Card>
      </section>

      {/* API密钥管理和通知设置区域 - 两栏布局 */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          {intl.formatMessage({ id: 'settings.section.integrations' })}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {intl.formatMessage({ id: 'settings.apiKeys.title' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApiKeysManagement />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {intl.formatMessage({ id: 'settings.notifications.title' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 系统偏好设置区域 */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          {intl.formatMessage({ id: 'settings.section.system' })}
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>
              {intl.formatMessage({ id: 'settings.system.title' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SystemPreferences />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}