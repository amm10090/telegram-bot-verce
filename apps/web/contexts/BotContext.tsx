/**
 * Bot上下文管理模块
 * 提供全局的机器人状态管理，包括：
 * - 机器人列表的获取和缓存
 * - 当前选中机器人的状态管理
 * - 加载状态和错误处理
 * - 数据持久化
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useToast } from "@workspace/ui/hooks/use-toast";

/**
 * 机器人配置文件接口
 */
interface BotProfile {
  description?: string;      // 机器人介绍
  shortDescription?: string; // 简短介绍
  avatarUrl?: string;       // 头像URL
  username?: string;        // 机器人用户名
  languageCode?: string;    // 机器人语言
  about?: string;          // 关于信息
}

/**
 * 机器人设置接口
 */
interface BotSettings {
  webhookUrl?: string;     // Webhook URL
  commands?: Array<{       // 命令列表
    command: string;
    description: string;
  }>;
  allowedUpdates?: string[]; // 允许的更新类型
  customizations?: any;      // 自定义配置
  accessControl?: {          // 访问控制设置
    enabled: boolean;
    defaultPolicy: 'allow' | 'deny';
    whitelistOnly: boolean;
  };
  autoReply?: {             // 自动回复设置
    enabled: boolean;
    maxRulesPerBot: number;
  };
}

/**
 * 机器人基础信息接口
 * @interface Bot
 * @property {string} id - 机器人唯一标识
 * @property {string} name - 机器人名称
 * @property {string} token - Telegram Bot Token
 * @property {string} apiKey - API密钥
 * @property {boolean} isEnabled - 是否启用
 * @property {'active' | 'inactive'} status - 机器人状态
 * @property {string} userId - 所属用户ID
 * @property {BotProfile} profile - 机器人配置文件
 * @property {BotSettings} settings - 机器人设置
 * @property {Array} menus - 菜单列表
 * @property {Array} autoReplies - 自动回复规则列表
 * @property {Array} accessControls - 访问控制列表
 * @property {string} createdAt - 创建时间
 * @property {string} updatedAt - 更新时间
 * @property {string} lastUsed - 最后使用时间
 */
interface Bot {
  id: string;
  name: string;
  token: string;
  apiKey: string;
  isEnabled: boolean;
  status: 'active' | 'inactive';
  userId?: string;
  profile?: BotProfile;
  settings?: BotSettings;
  menus: Array<{
    id?: string;
    text: string;
    command: string;
    order: number;
    response?: any;
  }>;
  autoReplies?: Array<{
    name: string;
    type: 'keyword' | 'regex';
    triggers: string[];
    isEnabled: boolean;
    priority: number;
    response: any;
  }>;
  accessControls?: Array<{
    type: 'user' | 'group';
    id: string;
    name?: string;
    listType: 'whitelist' | 'blacklist';
    reason?: string;
    expireAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

/**
 * Bot上下文类型定义
 * @interface BotContextType
 * @property {Bot[]} bots - 机器人列表
 * @property {Bot | null} selectedBot - 当前选中的机器人
 * @property {boolean} isLoading - 加载状态标志
 * @property {string | null} error - 错误信息
 * @property {function} selectBot - 选择机器人的方法
 * @property {function} refreshBots - 刷新机器人列表的方法
 */
interface BotContextType {
  bots: Bot[];
  selectedBot: Bot | null;
  isLoading: boolean;
  error: string | null;
  selectBot: (botId: string) => void;
  refreshBots: () => Promise<void>;
}

// 创建Bot上下文
const BotContext = createContext<BotContextType | undefined>(undefined);

/**
 * Bot上下文提供者组件
 * 管理机器人相关的全局状态，提供数据获取和更新的方法
 * @param {Object} props - 组件属性
 * @param {ReactNode} props.children - 子组件
 */
export function BotProvider({ children }: { children: ReactNode }) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  // 获取机器人列表
  const fetchBots = useCallback(async (savedBotId?: string | null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/bot/telegram/bots');
      if (!response.ok) {
        throw new Error('Failed to fetch bots');
      }
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const formattedBots = data.data.map((bot: any) => ({
          id: bot._id || bot.id,
          name: bot.name || '未命名机器人',
          token: bot.token || '',
          apiKey: bot.apiKey || '',
          isEnabled: bot.isEnabled ?? true,
          status: bot.status || 'inactive',
          userId: bot.userId,
          profile: bot.profile || {},
          settings: bot.settings || {},
          menus: bot.menus || [],
          autoReplies: bot.autoReplies || [],
          accessControls: bot.accessControls || [],
          createdAt: bot.createdAt || new Date().toISOString(),
          updatedAt: bot.updatedAt || new Date().toISOString(),
          lastUsed: bot.lastUsed?.toISOString()
        }));

        setBots(formattedBots);
        
        if (savedBotId) {
          const savedBot = formattedBots.find((bot: Bot) => bot.id === savedBotId);
          if (savedBot) {
            setSelectedBot(savedBot);
          } else {
            localStorage.removeItem('selectedBotId');
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to fetch bots',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // 只依赖 toast

  // 选择机器人
  const selectBot = useCallback((botId: string) => {
    const bot = bots.find((b: Bot) => b.id === botId);
    setSelectedBot(bot || null);
    if (bot) {
      localStorage.setItem('selectedBotId', botId);
    } else {
      localStorage.removeItem('selectedBotId');
    }
  }, [bots]);

  // 初始化时获取机器人列表
  useEffect(() => {
    if (!hasInitialized.current) {
      const savedBotId = localStorage.getItem('selectedBotId');
      fetchBots(savedBotId);
      hasInitialized.current = true;
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次

  const contextValue = {
    bots,
    selectedBot,
    isLoading,
    error,
    selectBot,
    refreshBots: useCallback(() => fetchBots(), [fetchBots])
  };

  return (
    <BotContext.Provider value={contextValue}>
      {children}
    </BotContext.Provider>
  );
}

/**
 * Bot上下文使用钩子
 * 提供便捷的方式访问Bot上下文
 * @throws {Error} 如果在Provider外部使用会抛出错误
 * @returns {BotContextType} Bot上下文值
 */
export function useBotContext() {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBotContext must be used within a BotProvider');
  }
  return context;
} 