// src/app/settings/page.tsx
import React from 'react';
import { useIntl } from 'react-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsForm from '@/components/settings/settings-form';

export default function SettingsPage() {
  const intl = useIntl();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 space-y-8">
        {/* 页面标题区域 */}
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {intl.formatMessage({ id: 'settings.title' })}
          </h1>
          <p className="text-muted-foreground">
            {intl.formatMessage({ id: 'settings.description' })}
          </p>
        </section>

        {/* 设置表单区域 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {intl.formatMessage({ id: 'settings.form.title' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}