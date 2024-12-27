import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Link2, Trash2 } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { useToast } from '@workspace/ui/hooks/use-toast';
import { telegramBotService } from '@/components/services/telegram-bot-service';

interface WebhookManagementProps {
  botId: string;
}

export function WebhookManagement({ botId }: WebhookManagementProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWebhookInfo();
  }, [botId]);

  const loadWebhookInfo = async () => {
    try {
      const response = await telegramBotService.getWebhook(botId);
      if (response.success && response.data.webhookUrl) {
        setWebhookUrl(response.data.webhookUrl);
      }
    } catch (error) {
      toast({
        title: intl.formatMessage({ id: 'error.title' }),
        description: intl.formatMessage({ id: 'webhook.error.load' }),
        variant: 'destructive',
      });
    }
  };

  const handleSetWebhook = async () => {
    try {
      setLoading(true);
      const response = await telegramBotService.setWebhook(botId, webhookUrl);
      if (response.success) {
        toast({
          description: intl.formatMessage({ id: 'webhook.success.set' }),
        });
      } else {
        toast({
          title: intl.formatMessage({ id: 'error.title' }),
          description: response.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: intl.formatMessage({ id: 'error.title' }),
        description: intl.formatMessage({ id: 'webhook.error.set' }),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    try {
      setLoading(true);
      const response = await telegramBotService.deleteWebhook(botId);
      if (response.success) {
        setWebhookUrl('');
        toast({
          description: intl.formatMessage({ id: 'webhook.success.delete' }),
        });
      } else {
        toast({
          title: intl.formatMessage({ id: 'error.title' }),
          description: response.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: intl.formatMessage({ id: 'error.title' }),
        description: intl.formatMessage({ id: 'webhook.error.delete' }),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={intl.formatMessage({ id: 'webhook.url.placeholder' })}
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          disabled={loading}
        />
        <Button onClick={handleSetWebhook} disabled={loading}>
          <Link2 className="mr-2 h-4 w-4" />
          {intl.formatMessage({ id: 'webhook.actions.set' })}
        </Button>
        {webhookUrl && (
          <Button
            variant="destructive"
            onClick={handleDeleteWebhook}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {intl.formatMessage({ id: 'webhook.actions.delete' })}
          </Button>
        )}
      </div>
    </div>
  );
} 