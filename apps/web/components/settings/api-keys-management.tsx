"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Copy, RefreshCw, Trash, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { useToast } from '@workspace/ui/hooks/use-toast';
import { TelegramBotService } from '@/components/services/telegram-bot-service';
import type { BotResponse } from '@/types/bot';
import { Badge } from '@workspace/ui/components/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { TelegramBotForm } from './telegram-bot-form';
import { BotSearch } from './bot-search';

// 创建单例服务实例
const botService = new TelegramBotService();

export default function ApiKeysManagement() {
  const intl = useIntl();
  const { toast } = useToast();
  const [bots, setBots] = useState<BotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 加载机器人列表
  const loadBots = useCallback(async () => {
    try {
      // 如果有正在进行的请求，取消它
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();
      setLoading(true);

      const result = await botService.getAllBots(
        undefined,
        abortControllerRef.current.signal
      );

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
      if (error instanceof DOMException && error.name === 'AbortError') {
        // 请求被取消，不做处理
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "error.title" }),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [intl, toast]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadBots();

    // 组件卸载时取消请求
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadBots]);

  // 使用 useCallback 优化其他函数
  const copyApiKey = useCallback(async (apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast({
        description: intl.formatMessage({ id: 'apiKeys.copied' }),
      });
    } catch (error) {
      toast({
        title: intl.formatMessage({ id: 'error.title' }),
        description: intl.formatMessage({ id: 'error.copy' }),
        variant: 'destructive',
      });
    }
  }, [intl, toast]);

  const handleDelete = useCallback(async () => {
    if (!selectedBotId) return;

    try {
      const response = await botService.deleteBot(selectedBotId);
      if (response.success) {
        toast({
          description: intl.formatMessage({ id: 'apiKeys.deleted' }),
        });
        loadBots();
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
        description: intl.formatMessage({ id: 'error.delete' }),
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedBotId(null);
    }
  }, [selectedBotId, intl, toast, loadBots]);

  const handleSearch = useCallback(async (query: string, type: string) => {
    try {
      setLoading(true);
      const response = await botService.searchBots(query, type as 'name' | 'token' | 'all');
      if (response.success) {
        setBots(response.data);
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
        description: intl.formatMessage({ id: 'error.search' }),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [intl, toast]);

  // 处理新增 Bot 成功
  const handleAddSuccess = useCallback((bot: BotResponse) => {
    setShowAddDialog(false);
    loadBots();
  }, [loadBots]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {intl.formatMessage({ id: 'apiKeys.title' })}
            </CardTitle>
            <CardDescription>
              {intl.formatMessage({ id: 'apiKeys.description' })}
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {intl.formatMessage({ id: 'apiKeys.actions.add' })}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {intl.formatMessage({ id: 'apiKeys.dialog.addTitle' })}
                </DialogTitle>
                <DialogDescription>
                  {intl.formatMessage({ id: 'apiKeys.dialog.addDescription' })}
                </DialogDescription>
              </DialogHeader>
              <TelegramBotForm onSuccess={handleAddSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <BotSearch onSearch={handleSearch} />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={loadBots}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {intl.formatMessage({ id: 'common.refresh' })}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {intl.formatMessage({ id: 'apiKeys.table.name' })}
                </TableHead>
                <TableHead>
                  {intl.formatMessage({ id: 'bot.form.token' })}
                </TableHead>
                <TableHead>
                  {intl.formatMessage({ id: 'apiKeys.table.status' })}
                </TableHead>
                <TableHead className="text-right">
                  {intl.formatMessage({ id: 'apiKeys.table.actions' })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      {intl.formatMessage({ id: 'common.loading' })}
                    </div>
                  </TableCell>
                </TableRow>
              ) : bots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {intl.formatMessage({ id: 'apiKeys.table.noData' })}
                  </TableCell>
                </TableRow>
              ) : (
                bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {bot.token}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bot.isEnabled ? 'default' : 'secondary'}>
                        {bot.isEnabled
                          ? intl.formatMessage({ id: 'common.status.active' })
                          : intl.formatMessage({ id: 'common.status.inactive' })}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyApiKey(bot.token)}
                          title={intl.formatMessage({ id: 'apiKeys.actions.copy' })}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedBotId(bot.id);
                            setShowDeleteDialog(true);
                          }}
                          title={intl.formatMessage({ id: 'apiKeys.actions.delete' })}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {intl.formatMessage({ id: 'apiKeys.delete.title' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {intl.formatMessage({ id: 'apiKeys.delete.description' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {intl.formatMessage({ id: 'common.cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {intl.formatMessage({ id: 'common.confirm' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}