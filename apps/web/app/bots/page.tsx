"use client";

import { BotProvider } from '@/contexts/BotContext';
import { BotConfigLayout } from '@/app/bots/bot-config-layout';

export default function BotsPage() {
  return (
    <BotProvider>
      <BotConfigLayout />
    </BotProvider>
  );
}