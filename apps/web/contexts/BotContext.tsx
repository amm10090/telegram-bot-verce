"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@workspace/ui/hooks/use-toast";

interface Bot {
  id: string;
  name: string;
  token: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface BotContextType {
  bots: Bot[];
  selectedBot: Bot | null;
  isLoading: boolean;
  error: string | null;
  selectBot: (botId: string) => void;
  refreshBots: () => Promise<void>;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export function BotProvider({ children }: { children: ReactNode }) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBots = async () => {
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
          status: bot.status || 'inactive',
          createdAt: bot.createdAt || new Date().toISOString(),
          updatedAt: bot.updatedAt || new Date().toISOString()
        }));

        setBots(formattedBots);
        
        if (selectedBot) {
          const updatedBot = formattedBots.find((bot: Bot) => bot.id === selectedBot.id);
          setSelectedBot(updatedBot || null);
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
  };

  const selectBot = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (bot) {
      setSelectedBot(bot);
      localStorage.setItem('selectedBotId', botId);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    const savedBotId = localStorage.getItem('selectedBotId');
    if (savedBotId && bots.length > 0) {
      selectBot(savedBotId);
    }
  }, [bots]);

  const value = {
    bots,
    selectedBot,
    isLoading,
    error,
    selectBot,
    refreshBots: fetchBots,
  };

  return (
    <BotContext.Provider value={value}>
      {children}
    </BotContext.Provider>
  );
}

export function useBotContext() {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBotContext must be used within a BotProvider');
  }
  return context;
} 