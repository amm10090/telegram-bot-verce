"use client"

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';
import { NextUIProvider } from "@nextui-org/react";

const ClientLayout = dynamic(() => import('./ClientLayout'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-2 text-foreground">加载中...</p>
      </div>
    </div>
  ),
});

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <ClientLayout>{children}</ClientLayout>
    </NextUIProvider>
  );
}