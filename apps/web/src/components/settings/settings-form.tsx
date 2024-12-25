// src/components/settings/settings-form.tsx
// 设置表单的主组件，使用选项卡组织不同类别的设置
"use client"

import { useState } from "react"
import { useIntl } from 'react-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@telegram-bot/ui"
import UserProfile from "./user-profile"
import NotificationPreferences from "./notification-preferences"
import ApiKeysManagement from "./api-keys-management"
import SystemPreferences from "./system-preferences"
import SecuritySettings from "./security-settings"
import React from "react";

export default function SettingsForm() {
  // 使用 state 管理当前激活的选项卡
  const [activeTab, setActiveTab] = useState("profile")
  const intl = useIntl();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      {/* 选项卡导航 */}
      <TabsList>
        <TabsTrigger value="profile">
          {intl.formatMessage({ id: 'settings.tabs.profile' })}
        </TabsTrigger>
        <TabsTrigger value="notifications">
          {intl.formatMessage({ id: 'settings.tabs.notifications' })}
        </TabsTrigger>
        <TabsTrigger value="api-keys">
          {intl.formatMessage({ id: 'settings.tabs.apiKeys' })}
        </TabsTrigger>
        <TabsTrigger value="system">
          {intl.formatMessage({ id: 'settings.tabs.system' })}
        </TabsTrigger>
        <TabsTrigger value="security">
          {intl.formatMessage({ id: 'settings.tabs.security' })}
        </TabsTrigger>
      </TabsList>

      {/* 选项卡内容区域 */}
      <TabsContent value="profile">
        <UserProfile />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationPreferences />
      </TabsContent>
      <TabsContent value="api-keys">
        <ApiKeysManagement />
      </TabsContent>
      <TabsContent value="system">
        <SystemPreferences />
      </TabsContent>
      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>
    </Tabs>
  )
}