"use client";

import { BotProvider } from '@/contexts/BotContext';
import { BotConfigLayout } from '@/components/features/bot-config-layout';

export default function BotsPage() {
  return (
    <BotProvider>
      <BotConfigLayout />
    </BotProvider>
  );
}