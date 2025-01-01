"use client";

import { useIntl } from "react-intl";
import { useRouter } from "next/navigation";
import {
  Bot as BotIcon,
  Menu as MenuIcon,
  MessageSquare,
  Users,
  Settings2,
  ChevronRight,
  Plus
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { MenuSettings } from "@/components/features/menu-settings";
import { Badge } from "@workspace/ui/components/badge";
import { useState } from 'react';
import { useBotContext } from '@/contexts/BotContext';
import { useToast } from "@workspace/ui/hooks/use-toast";

// 功能卡片配置
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

export function BotConfigLayout() {
  const intl = useIntl();
  const router = useRouter();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const { bots = [], selectedBot, isLoading, error, selectBot } = useBotContext();
  const { toast } = useToast();

  const handleFeatureClick = (feature: typeof botFeatures[0]) => {
    if (!selectedBot) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "error.title" }),
        description: intl.formatMessage({ id: "error.selectBot" }),
      });
      return;
    }

    if (feature.id === "menu") {
      setIsMenuDrawerOpen(true);
    } else {
      router.push(`${feature.href}?botId=${selectedBot.id}`);
    }
  };

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
        <Button onClick={() => router.push("/settings#api-keys")}>
          <Plus className="mr-2 h-4 w-4" />
          {intl.formatMessage({ id: "bots.actions.add" })}
        </Button>
      </div>

      <div className="mb-6">
        <Select
          value={selectedBot?.id || ""}
          onValueChange={selectBot}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue 
              placeholder={
                isLoading 
                  ? "加载中..."
                  : bots.length === 0
                  ? "暂无机器人"
                  : "选择机器人"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(bots) && bots.length > 0 ? (
              bots.map((bot) => (
                <SelectItem key={bot.id} value={bot.id}>
                  <div className="flex items-center gap-2">
                    <BotIcon className="h-4 w-4" />
                    <span>{bot.name}</span>
                    <Badge 
                      variant={bot.status === 'active' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {bot.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                <div className="text-muted-foreground">暂无机器人</div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
        {!isLoading && bots.length === 0 && !error && (
          <p className="text-sm text-muted-foreground mt-2">
            暂无机器人，请先添加机器人
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {botFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              className={`group transition-colors ${
                selectedBot 
                  ? "hover:border-primary/50 cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => handleFeatureClick(feature)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{intl.formatMessage({ id: feature.title })}</CardTitle>
                  </div>
                  {selectedBot && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeatureClick(feature);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
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

      {selectedBot && (
        <MenuSettings
          isOpen={isMenuDrawerOpen}
          onClose={() => setIsMenuDrawerOpen(false)}
        />
      )}
    </div>
  );
} 