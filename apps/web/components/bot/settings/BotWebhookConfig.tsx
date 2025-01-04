import { useState, useEffect } from "react";
import { Input, Button } from "@nextui-org/react";
import { useIntl } from "react-intl";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BotWebhookConfigProps {
  bot: any;
}

export function BotWebhookConfig({ bot }: BotWebhookConfigProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 加载当前的webhook配置
  useEffect(() => {
    const fetchWebhookConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/bot/telegram/bots/${bot.id}/webhook`);
        if (!response.ok) throw new Error("Failed to fetch webhook config");
        
        const data = await response.json();
        setWebhookUrl(data.data.webhookUrl || "");
      } catch (error) {
        toast({
          variant: "destructive",
          title: intl.formatMessage({ id: "webhook.fetch.error.title" }),
          description: intl.formatMessage({ id: "webhook.fetch.error.description" }),
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (bot.id) {
      fetchWebhookConfig();
    }
  }, [bot.id]);

  // 保存webhook配置
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/bot/telegram/bots/${bot.id}/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: webhookUrl }),
      });

      if (!response.ok) throw new Error("Failed to save webhook config");

      toast({
        title: intl.formatMessage({ id: "webhook.save.success.title" }),
        description: intl.formatMessage({ id: "webhook.save.success.description" }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "webhook.save.error.title" }),
        description: intl.formatMessage({ id: "webhook.save.error.description" }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 删除webhook配置
  const handleDelete = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/bot/telegram/bots/${bot.id}/webhook`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete webhook config");

      setWebhookUrl("");
      toast({
        title: intl.formatMessage({ id: "webhook.delete.success.title" }),
        description: intl.formatMessage({ id: "webhook.delete.success.description" }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "webhook.delete.error.title" }),
        description: intl.formatMessage({ id: "webhook.delete.error.description" }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        type="url"
        label={intl.formatMessage({ id: "webhook.url.label" })}
        placeholder={intl.formatMessage({ id: "webhook.url.placeholder" })}
        value={webhookUrl}
        onChange={(e) => setWebhookUrl(e.target.value)}
        description={intl.formatMessage({ id: "webhook.url.description" })}
      />

      <div className="flex gap-3">
        <Button
          color="primary"
          onClick={handleSave}
          isLoading={isSaving}
          isDisabled={!webhookUrl}
        >
          {intl.formatMessage({ id: "webhook.save.button" })}
        </Button>

        {webhookUrl && (
          <Button
            color="danger"
            variant="light"
            onClick={handleDelete}
            isLoading={isSaving}
          >
            {intl.formatMessage({ id: "webhook.delete.button" })}
          </Button>
        )}
      </div>
    </div>
  );
} 