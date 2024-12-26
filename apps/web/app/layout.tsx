import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import ClientProvider from '../components/ClientProvider';

export const metadata: Metadata = {
  title: 'TG Bot Management',
  description: 'Telegram Bot Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}