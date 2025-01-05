import { useState, useEffect } from "react";
import { Input, Button } from "@nextui-org/react";
import { useIntl } from "react-intl";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WebhookInfo {
  url?: string;
  pending_update_count?: number;
  last_error_message?: string;
  last_error_date?: number;
  has_custom_certificate?: boolean;
  isConsistent?: boolean;
}

interface WebhookResponse {
  success: boolean;
  data?: {
    webhookUrl: string;
    telegramWebhookInfo: WebhookInfo;
    isConsistent: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface BotWebhookConfigProps {
  bot: any;
}

export function BotWebhookConfig({ bot }: BotWebhookConfigProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 获取基础URL
  const getBaseWebhookUrl = () => {
    return `https://bot.amoze.cc/api/bot/telegram/bots/${bot.id}/webhook`;
  };

  // 从API获取webhook状态
  const fetchWebhookInfo = async () => {
    try {
      const response = await fetch(`/api/bot/telegram/bots/${bot.id}/webhook`);
      const data: WebhookResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || "获取webhook信息失败");
      }
      
      return {
        localUrl: data.data?.webhookUrl || getBaseWebhookUrl(),
        telegramInfo: data.data?.telegramWebhookInfo || {},
        isConsistent: data.data?.isConsistent || false
      };
    } catch (error) {
      console.error("获取webhook信息失败:", error);
      throw error;
    }
  };

  // 初始化webhook配置
  const initializeWebhook = async () => {
    try {
      setIsLoading(true);
      const { localUrl, telegramInfo, isConsistent } = await fetchWebhookInfo();
      
      setWebhookUrl(localUrl);
      setOriginalUrl(localUrl);
      setWebhookInfo({ ...telegramInfo, isConsistent });
      
      if (!isConsistent) {
        toast({
          variant: "destructive",
          title: intl.formatMessage({ id: "webhook.sync.warning.title" }),
          description: intl.formatMessage({ id: "webhook.sync.warning.description" }),
        });
      }
      
      setIsInitialized(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "webhook.init.error.title" }),
        description: error instanceof Error ? error.message : intl.formatMessage({ id: "webhook.init.error.description" }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bot.id && !isInitialized) {
      // 设置默认的webhook URL
      setWebhookUrl(getBaseWebhookUrl());
      initializeWebhook();
    }
  }, [bot.id, isInitialized]);

  // 监控URL变化
  useEffect(() => {
    setHasChanges(webhookUrl !== originalUrl);
  }, [webhookUrl, originalUrl]);

  // 保存webhook配置
  const handleSave = async () => {
    if (!webhookUrl) return;
    
    const previousUrl = originalUrl;
    const previousInfo = webhookInfo;
    
    try {
      setIsSaving(true);

      const response = await fetch(`/api/bot/telegram/bots/${bot.id}/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });

      const data: WebhookResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || "设置webhook失败");
      }

      // 刷新webhook状态
      const { localUrl, telegramInfo, isConsistent } = await fetchWebhookInfo();
      
      setWebhookUrl(localUrl);
      setOriginalUrl(localUrl);
      setWebhookInfo({ ...telegramInfo, isConsistent });
      setHasChanges(false);

      toast({
        title: intl.formatMessage({ 
          id: previousUrl ? "webhook.update.success.title" : "webhook.save.success.title" 
        }),
        description: intl.formatMessage({ 
          id: previousUrl ? "webhook.update.success.description" : "webhook.save.success.description" 
        }),
      });
    } catch (error) {
      // 恢复之前的状态
      setWebhookUrl(previousUrl);
      setWebhookInfo(previousInfo);
      
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "webhook.save.error.title" }),
        description: error instanceof Error ? error.message : intl.formatMessage({ id: "webhook.save.error.description" }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 删除webhook配置
  const handleDelete = async () => {
    const previousUrl = originalUrl;
    const previousInfo = webhookInfo;
    
    try {
      setIsSaving(true);

      const response = await fetch(`/api/bot/telegram/bots/${bot.id}/webhook`, {
        method: "DELETE",
      });

      const data: WebhookResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || "删除webhook失败");
      }

      // 刷新webhook状态
      const { localUrl, telegramInfo, isConsistent } = await fetchWebhookInfo();
      
      setWebhookUrl(localUrl);
      setOriginalUrl(localUrl);
      setWebhookInfo({ ...telegramInfo, isConsistent });
      setHasChanges(false);

      toast({
        title: intl.formatMessage({ id: "webhook.delete.success.title" }),
        description: intl.formatMessage({ id: "webhook.delete.success.description" }),
      });
    } catch (error) {
      // 恢复之前的状态
      setWebhookUrl(previousUrl);
      setWebhookInfo(previousInfo);
      
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "webhook.delete.error.title" }),
        description: error instanceof Error ? error.message : intl.formatMessage({ id: "webhook.delete.error.description" }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 显示webhook状态
  const renderWebhookStatus = () => {
    if (!webhookInfo.isConsistent) {
      return (
        <div className="text-sm text-warning mt-2">
          {intl.formatMessage({ id: "webhook.status.inconsistent" })}
        </div>
      );
    }

    if (webhookInfo.last_error_message) {
      return (
        <div className="text-sm text-danger mt-2">
          {intl.formatMessage(
            { id: "webhook.status.error" },
            { error: webhookInfo.last_error_message }
          )}
        </div>
      );
    }

    if (webhookInfo.pending_update_count && webhookInfo.pending_update_count > 0) {
      return (
        <div className="text-sm text-warning mt-2">
          {intl.formatMessage(
            { id: "webhook.status.pending" },
            { count: webhookInfo.pending_update_count }
          )}
        </div>
      );
    }

    if (webhookUrl) {
      return (
        <div className="text-sm text-success mt-2">
          {intl.formatMessage({ id: "webhook.status.active" })}
        </div>
      );
    }

    return null;
  };

  if (isLoading || !isInitialized) {
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
        errorMessage={webhookInfo.last_error_message}
        isDisabled={isSaving}
      />

      {renderWebhookStatus()}

      <div className="flex gap-3">
        <Button
          color="primary"
          onClick={handleSave}
          isLoading={isSaving}
          isDisabled={!webhookUrl || !hasChanges || isSaving}
        >
          {originalUrl 
            ? intl.formatMessage({ id: "webhook.update.button" })
            : intl.formatMessage({ id: "webhook.save.button" })}
        </Button>

        {webhookUrl && (
          <Button
            color="danger"
            variant="light"
            onClick={handleDelete}
            isLoading={isSaving}
            isDisabled={isSaving}
          >
            {intl.formatMessage({ id: "webhook.delete.button" })}
          </Button>
        )}

        {hasChanges && (
          <Button
            variant="light"
            onClick={() => {
              setWebhookUrl(originalUrl);
              setHasChanges(false);
            }}
            isDisabled={isSaving}
          >
            {intl.formatMessage({ id: "webhook.cancel.button" })}
          </Button>
        )}
      </div>
    </div>
  );
} 