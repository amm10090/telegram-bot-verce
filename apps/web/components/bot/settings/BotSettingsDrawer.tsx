import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button
} from "@nextui-org/react";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { useIntl } from "react-intl";
import { BotAvatarUpload } from "./BotAvatarUpload";
import { BotBasicInfoForm } from "./BotBasicInfoForm";
import BotWebhookConfig from "./BotWebhookConfig";

interface BotSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bot: any;
}

export function BotSettingsDrawer({ isOpen, onClose, bot }: BotSettingsDrawerProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  // 处理表单数据变更
  const handleFormChange = (data: any) => {
    setFormData(data);
  };

  // 处理保存
  const handleSave = async () => {
    if (!bot?.id || !formData) return;
    
    try {
      setIsSaving(true);
      
      // 调用设置名称API
      const nameResponse = await fetch(`/api/bot/telegram/bots/${bot.id}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: formData.name
        })
      });

      if (!nameResponse.ok) {
        throw new Error('设置机器人名称失败');
      }

      // 调用设置描述API
      const descResponse = await fetch(`/api/bot/telegram/bots/${bot.id}/shortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: formData.description || ''
        })
      });

      if (!descResponse.ok) {
        throw new Error('设置机器人简短描述失败');
      }

      toast({
        title: intl.formatMessage({ id: "settings.save.success.title" }),
        description: intl.formatMessage({ id: "settings.save.success.description" }),
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "settings.save.error.title" }),
        description: error instanceof Error ? error.message : intl.formatMessage({ id: "settings.save.error.description" }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose}
      placement="right"
      size="lg"
      backdrop="blur"
    >
      <DrawerContent>
        <DrawerHeader className="border-b border-divider">
          <h3 className="text-xl font-semibold">
            {intl.formatMessage({ id: "bot.settings.title" })}
          </h3>
        </DrawerHeader>
        
        <DrawerBody className="p-6">
          <div className="space-y-8">
            {/* 头像上传区域 */}
            <section>
              <h4 className="text-lg font-medium mb-4">
                {intl.formatMessage({ id: "bot.settings.avatar.title" })}
              </h4>
              <BotAvatarUpload bot={bot} />
            </section>

            {/* 基本信息表单 */}
            <section>
              <h4 className="text-lg font-medium mb-4">
                {intl.formatMessage({ id: "bot.settings.basicInfo.title" })}
              </h4>
              <BotBasicInfoForm 
                bot={bot} 
                onSubmit={handleFormChange}
              />
            </section>

            {/* Webhook 配置 */}
            <section>
              <h4 className="text-lg font-medium mb-4">
                {intl.formatMessage({ id: "bot.settings.webhook.title" })}
              </h4>
              <BotWebhookConfig bot={bot} />
            </section>
          </div>
        </DrawerBody>

        <DrawerFooter className="border-t border-divider">
          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose}
              isDisabled={isSaving}
            >
              {intl.formatMessage({ id: "common.cancel" })}
            </Button>
            <Button 
              color="primary"
              onClick={handleSave}
              isLoading={isSaving}
              isDisabled={!formData}
            >
              {intl.formatMessage({ id: "common.save" })}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 