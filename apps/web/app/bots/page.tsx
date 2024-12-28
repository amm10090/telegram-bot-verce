"use client";

import { useState, useEffect } from "react";
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
import { TelegramBotService } from "@/components/services/telegram-bot-service";
import type { BotResponse } from "@/types/bot";
import { useToast } from "@workspace/ui/hooks/use-toast";

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

const botService = new TelegramBotService();

export default function BotsPage() {
  const intl = useIntl();
  const router = useRouter();
  const { toast } = useToast();
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [bots, setBots] = useState<BotResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载机器人列表
  useEffect(() => {
    const loadBots = async () => {
      try {
        setLoading(true);
        const result = await botService.getAllBots();
        if (result.success) {
          setBots(result.data);
        } else {
          toast({
            variant: "destructive",
            title: intl.formatMessage({ id: "error.title" }),
            description: result.message || intl.formatMessage({ id: "error.unknown" }),
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: intl.formatMessage({ id: "error.title" }),
          description: intl.formatMessage({ id: "error.loading" }),
        });
      } finally {
        setLoading(false);
      }
    };

    loadBots();
  }, [intl, toast]);

  const handleFeatureClick = (feature: typeof botFeatures[0]) => {
    if (!selectedBotId) {
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
      router.push(`${feature.href}?botId=${selectedBotId}`);
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
        <Button onClick={() => router.push("/settings")}>
          <Plus className="mr-2 h-4 w-4" />
          {intl.formatMessage({ id: "bots.actions.add" })}
        </Button>
      </div>

      <div className="mb-6">
        <Select
          value={selectedBotId || ""}
          onValueChange={(value) => setSelectedBotId(value)}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder={intl.formatMessage({ id: "bots.select.placeholder" })} />
          </SelectTrigger>
          <SelectContent>
            {bots.map((bot) => (
              <SelectItem key={bot.id} value={bot.id}>
                <div className="flex items-center gap-2">
                  <BotIcon className="h-4 w-4" />
                  <span>{bot.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {botFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              className={`group transition-colors ${
                selectedBotId 
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
                  {selectedBotId && (
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

      {selectedBotId && (
        <MenuSettings
          botId={selectedBotId}
          isOpen={isMenuDrawerOpen}
          onClose={() => setIsMenuDrawerOpen(false)}
        />
      )}

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