"use client";

import { useIntl } from "react-intl";
import { useRouter } from "next/navigation";
import {
  Bot as BotIcon,
  Menu as MenuIcon,
  MessageSquare,
  Users,
  Settings2,
  ChevronRight
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

// 示例数据
const botFeatures = [
  {
    id: "menu",
    title: "bots.features.menu.title",
    description: "bots.features.menu.description",
    icon: MenuIcon,
    href: "/bots/menu-settings"
  },
  {
    id: "keywords",
    title: "bots.features.keywords.title",
    description: "bots.features.keywords.description",
    icon: MessageSquare,
    href: "/bots/keyword-replies"
  },
  {
    id: "users",
    title: "bots.features.users.title",
    description: "bots.features.users.description",
    icon: Users,
    href: "/bots/user-management"
  },
  {
    id: "settings",
    title: "bots.features.settings.title",
    description: "bots.features.settings.description",
    icon: Settings2,
    href: "/bots/settings"
  }
];

export default function BotsPage() {
  const intl = useIntl();
  const router = useRouter();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {intl.formatMessage({ id: "bots.configuration.title" })}
          </h1>
          <p className="text-muted-foreground mt-2">
            {intl.formatMessage({ id: "bots.configuration.description" })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {botFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              className="group hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(feature.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{intl.formatMessage({ id: feature.title })}</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(feature.href);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {intl.formatMessage({ id: feature.description })}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BotIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{intl.formatMessage({ id: "bots.quickStart.title" })}</CardTitle>
                <CardDescription>
                  {intl.formatMessage({ id: "bots.quickStart.description" })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">
                  {intl.formatMessage({ id: "bots.quickStart.step1.title" })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: "bots.quickStart.step1.description" })}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">
                  {intl.formatMessage({ id: "bots.quickStart.step2.title" })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: "bots.quickStart.step2.description" })}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">
                  {intl.formatMessage({ id: "bots.quickStart.step3.title" })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {intl.formatMessage({ id: "bots.quickStart.step3.description" })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}