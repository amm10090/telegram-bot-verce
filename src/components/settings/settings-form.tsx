"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfile } from "@/components/settings/user-profile"
import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { ApiKeysManagement } from "@/components/settings/api-keys-management"
import { SystemPreferences } from "@/components/settings/system-preferences"
import { SecuritySettings } from "@/components/settings/security-settings"

export default function SettingsForm() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
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

