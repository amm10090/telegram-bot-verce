/**
 * Bot Webhook 配置组件
 * 
 * 该组件提供了 Telegram Bot Webhook 的可视化配置界面，包括：
 * 1. 显示当前 webhook URL
 * 2. 自动设置 webhook
 * 3. 手动设置 webhook
 * 4. 删除 webhook
 * 
 * 状态管理：
 * - webhookUrl: 当前配置的 webhook URL
 * - isLoading: 加载状态标识
 * - isSaving: 保存操作状态标识
 */

"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Spinner } from "@nextui-org/react";
import { useBotContext } from '@/contexts/BotContext';
import { useToast } from "@workspace/ui/hooks/use-toast";

interface BotWebhookConfigProps {
  bot: any;  // Bot 配置对象
}

export default function BotWebhookConfig({ bot }: BotWebhookConfigProps) {
  // 从上下文获取当前选中的机器人信息
  const { selectedBot } = useBotContext();
  const { toast } = useToast();
  
  // 组件状态管理
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 初始化时获取当前 webhook 配置
   * 当选中的机器人变化时重新获取
   */
  useEffect(() => {
    const fetchWebhookConfig = async () => {
      if (!selectedBot?.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/webhook`);
        if (!response.ok) throw new Error('获取webhook配置失败');
        
        const data = await response.json();
        setWebhookUrl(data.url || '');
      } catch (error) {
        toast({
          variant: "destructive",
          title: "错误",
          description: error instanceof Error ? error.message : '获取webhook配置失败'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebhookConfig();
  }, [selectedBot?.id, toast]);

  /**
   * 自动设置 webhook
   * 使用当前域名自动生成 webhook URL 并设置
   */
  const handleAutoSetWebhook = async () => {
    if (!selectedBot?.id) return;
    
    setIsSaving(true);
    try {
      // 使用当前域名构建 webhook URL
      const domain = window.location.origin;
      const autoWebhookUrl = `${domain}/api/bot/telegram/webhook`;
      
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: autoWebhookUrl })
      });

      if (!response.ok) throw new Error('自动设置webhook失败');
      
      setWebhookUrl(autoWebhookUrl);
      toast({
        title: "成功",
        description: "Webhook已自动设置"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : '自动设置webhook失败'
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 保存手动设置的 webhook 配置
   * 将用户输入的 URL 保存为新的 webhook 地址
   */
  const handleSaveWebhook = async () => {
    if (!selectedBot?.id) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });

      if (!response.ok) throw new Error('保存webhook配置失败');
      
      toast({
        title: "成功",
        description: "Webhook配置已保存"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : '保存webhook配置失败'
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 删除当前 webhook 配置
   */
  const handleDeleteWebhook = async () => {
    if (!selectedBot?.id) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/bot/telegram/bots/${selectedBot.id}/webhook`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('删除webhook配置失败');
      
      setWebhookUrl('');
      toast({
        title: "成功",
        description: "Webhook配置已删除"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : '删除webhook配置失败'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 如果没有选中机器人，显示提示信息
  if (!selectedBot) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-default-500">请先选择一个机器人</p>
        </CardBody>
      </Card>
    );
  }

  // 渲染 webhook 配置界面
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Webhook 配置</h3>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Input
                id="webhook-url"
                label="Webhook URL"
                value={webhookUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebhookUrl(e.target.value)}
                placeholder="请输入 Webhook URL"
                isDisabled={isSaving}
                variant="bordered"
              />
            </div>
          </div>
        )}
      </CardBody>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="bordered"
            onPress={handleAutoSetWebhook}
            isDisabled={isLoading || isSaving}
          >
            自动设置
          </Button>
          <Button
            variant="bordered"
            color="danger"
            onPress={handleDeleteWebhook}
            isDisabled={isLoading || isSaving || !webhookUrl}
          >
            删除
          </Button>
        </div>
        <Button
          color="primary"
          onPress={handleSaveWebhook}
          isDisabled={isLoading || isSaving || !webhookUrl}
        >
          保存
        </Button>
      </CardFooter>
    </Card>
  );
}
