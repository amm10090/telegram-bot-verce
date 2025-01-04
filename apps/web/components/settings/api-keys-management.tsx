/**
 * API密钥管理组件
 * 提供机器人的API密钥管理功能，包括：
 * - 查看和搜索现有机器人列表
 * - 添加新的机器人
 * - 删除现有机器人
 * - 复制API密钥
 * - 刷新机器人列表
 */
"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Copy, RefreshCw, Trash, Plus, Eye } from 'lucide-react';
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
import { Chip } from "@nextui-org/react";
import { ActiveIcon, InactiveIcon } from '../icons/status-icons';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { TelegramBotForm } from './telegram-bot-form';
import { BotSearch } from './bot-search';

// 创建TelegramBotService单例实例
const botService = new TelegramBotService();

// 添加状态芯片组件
function StatusChip({ status, onClick }: { status: string; onClick: () => void }) {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleClick = () => {
    setIsFlipping(true);
    onClick();
    // 动画结束后重置状态
    setTimeout(() => setIsFlipping(false), 300);
  };

  return (
    <div className={`status-chip-flip ${isFlipping ? 'flipping' : ''}`}>
      <div className="status-chip-flip-inner">
        <Chip
          startContent={status === 'active' ? <ActiveIcon /> : <InactiveIcon />}
          variant="flat"
          color={status === 'active' ? 'success' : 'danger'}
          size="sm"
          radius="sm"
          className="cursor-pointer transition-all duration-300"
          onClick={handleClick}
        >
          {status}
        </Chip>
      </div>
    </div>
  );
}

// 移动端卡片组件
function BotCard({ bot, onDelete, onCopy, onStatusChange }: { 
  bot: BotResponse; 
  onDelete: (id: string) => void;
  onCopy: (token: string) => void;
  onStatusChange: (bot: BotResponse) => void;
}) {
  const intl = useIntl();
  const tokenId = bot.token.split(':')[0];

  return (
    <div className="p-4 hover:bg-accent/5 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-base">{bot.name}</span>
            <StatusChip 
              status={bot.status} 
              onClick={() => onStatusChange(bot)} 
            />
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              {tokenId}
            </code>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onCopy(bot.token)}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[calc(100vw-2rem)] p-3 border bg-popover shadow-lg" 
                  side="top" 
                  align="end"
                  sideOffset={5}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        {intl.formatMessage({ id: 'bot.form.token' })}
                      </h4>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onCopy(bot.token)}
                        className="h-7 w-7"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-md">
                      <code className="text-xs font-mono text-foreground break-all whitespace-normal">
                        {bot.token}
                      </code>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          onClick={() => onDelete(bot.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// 桌面端表格行组件
function BotTableRow({ bot, onDelete, onCopy, onStatusChange }: {
  bot: BotResponse;
  onDelete: (id: string) => void;
  onCopy: (token: string) => void;
  onStatusChange: (bot: BotResponse) => void;
}) {
  const intl = useIntl();
  const tokenId = bot.token.split(':')[0];

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{bot.name}</span>
          <StatusChip 
            status={bot.status} 
            onClick={() => onStatusChange(bot)} 
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {tokenId}
          </code>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
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
                    onClick={() => onCopy(bot.token)}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-background/50 p-3 rounded-md border">
                  <code className="text-sm font-mono text-foreground break-all whitespace-normal">
                    {bot.token}
                  </code>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(bot.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ApiKeysManagement() {
  const intl = useIntl();
  const { toast } = useToast();
  const [bots, setBots] = useState<BotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);  // 添加一个ref来跟踪加载状态

  // 加载机器人列表
  const loadBots = useCallback(async (isManualRefresh = false) => {
    // 如果已经在加载中且不是手动刷新，则跳过
    if (isLoadingRef.current && !isManualRefresh) {
      return;
    }

    try {
      // 只有在手动刷新或有新请求时才取消之前的请求
      if (isManualRefresh && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();
      setLoading(true);
      isLoadingRef.current = true;

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
      // 如果是取消请求的错误，不做处理
      if (error instanceof DOMException && error.name === 'AbortError') {
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
      isLoadingRef.current = false;
    }
  }, [intl, toast]); // 恢复必要的依赖

  // 组件挂载时加载数据
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    loadBots();

    // 组件卸载时才取消请求
    return () => {
      controller.abort();
    };
  }, [loadBots]);

  // 处理手动刷新
  const handleRefresh = useCallback(() => {
    loadBots(true);
  }, [loadBots]);

  // 复制API密钥到剪贴板
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

  // 处理删除机器人
  const handleDelete = useCallback(async () => {
    if (!selectedBotId) return;

    try {
      const response = await botService.deleteBot(selectedBotId);
      if (response.success) {
        toast({
          description: intl.formatMessage({ id: 'apiKeys.deleted' }),
        });
        loadBots();  // 重新加载列表
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

  // 处理搜索机器人
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

  // 处理添加机器人成功
  const handleAddSuccess = useCallback((bot: BotResponse) => {
    setShowAddDialog(false);
    loadBots();  // 重新加载列表以显示新添加的机器人
  }, [loadBots]);

  const handleDeleteClick = useCallback((id: string) => {
    setSelectedBotId(id);
    setShowDeleteDialog(true);
  }, []);

  // 处理状态切换
  const handleStatusChange = useCallback(async (bot: BotResponse) => {
    try {
      const newStatus = bot.status === 'active' ? 'disabled' : 'active';
      const response = await botService.updateBotStatus(bot.id, newStatus);
      
      if (response.success) {
        toast({
          description: intl.formatMessage(
            { id: 'bot.status.changed' },
            { status: newStatus }
          ),
        });
        loadBots();  // 重新加载列表
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
        description: intl.formatMessage({ id: 'error.statusChange' }),
        variant: 'destructive',
      });
    }
  }, [intl, toast, loadBots]);

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
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {intl.formatMessage({ id: 'common.refresh' })}
            </Button>
          </div>
          <div className="rounded-md border">
            {/* 桌面端表格视图 */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{intl.formatMessage({ id: 'apiKeys.table.name' })}</TableHead>
                    <TableHead>{intl.formatMessage({ id: 'bot.form.token' })}</TableHead>
                    <TableHead className="w-[90px]">
                      {intl.formatMessage({ id: 'apiKeys.table.actions' })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bots.map((bot) => (
                    <BotTableRow
                      key={bot.id}
                      bot={bot}
                      onDelete={handleDeleteClick}
                      onCopy={copyApiKey}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 移动端卡片视图 */}
            <div className="sm:hidden divide-y">
              {bots.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  onDelete={handleDeleteClick}
                  onCopy={copyApiKey}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {intl.formatMessage({ id: 'apiKeys.dialog.deleteTitle' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {intl.formatMessage({ id: 'apiKeys.dialog.deleteDescription' })}
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