"use client"

import React from 'react';
import { useSession } from '@/lib/auth-client';
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Bot, Shield, Zap, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session?.user) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">TG Bot Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="ghost">登录</Button>
              </Link>
              <Link href="/signup">
                <Button>注册</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            管理您的
            <span className="text-primary"> Telegram 机器人</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            强大、简单、高效的 Telegram 机器人管理平台。轻松配置、监控和控制您的所有机器人。
          </p>
          <div className="space-x-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                开始使用
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                立即登录
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>快速配置</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                简单直观的配置界面，几分钟内即可完成机器人设置
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>实时监控</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                全面的数据分析和实时监控，掌握机器人运行状态
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>安全可靠</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                企业级安全保障，确保您的数据和机器人安全
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-8 w-8 text-primary mb-2" />
              <CardTitle>多机器人管理</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                统一管理多个机器人，提高运营效率
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}