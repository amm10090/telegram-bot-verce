"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Copy, RefreshCw, Trash, Plus, MoreHorizontal, Eye } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
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
  const isLoadingRef = useRef(false);

  // 加载机器人列表
  const loadBots = useCallback(async () => {
    // 如果正在加载，则跳过
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
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
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast({
        variant: "destructive",
        title: intl.formatMessage({ id: "error.title" }),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [intl, toast]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadBots();
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{intl.formatMessage({ id: 'apiKeys.table.name' })}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {intl.formatMessage({ id: 'bot.form.token' })}
                  </TableHead>
                  <TableHead className="w-[90px]">
                    {intl.formatMessage({ id: 'apiKeys.table.status' })}
                  </TableHead>
                  <TableHead className="w-[100px] text-right">
                    {intl.formatMessage({ id: 'apiKeys.table.actions' })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col sm:hidden gap-1">
                        <span>{bot.name}</span>
                        <code className="text-xs font-mono text-muted-foreground">
                          {bot.token.split(':')[0]}
                        </code>
                      </div>
                      <span className="hidden sm:block">{bot.name}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-sm text-muted-foreground">
                      {bot.token.split(':')[0]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bot.isEnabled ? 'default' : 'secondary'}>
                        {bot.isEnabled ? 
                          intl.formatMessage({ id: 'common.status.active' }) :
                          intl.formatMessage({ id: 'common.status.inactive' })
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">查看密钥</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-[min(calc(100vw-2rem),400px)] p-3 border bg-popover shadow-lg" 
                            side="top" 
                            align="end"
                            sideOffset={5}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-muted-foreground">
                                  {intl.formatMessage({ id: 'bot.form.token' })}
                                </h4>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => copyApiKey(bot.token)}
                                  className="h-8 w-8"
                                >
                                  <Copy className="h-4 w-4" />
                                  <span className="sr-only">复制密钥</span>
                                </Button>
                              </div>
                              <div className="bg-background/50 p-3 rounded-md border">
                                <div className="max-w-full overflow-hidden">
                                  <code className="text-sm font-mono text-foreground break-all whitespace-normal">{bot.token}</code>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedBotId(bot.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">删除</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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