import mongoose from 'mongoose';
import { Router } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class HealthService {
  private startTime: number;
  private routes: Set<string>;

  constructor() {
    this.startTime = Date.now();
    this.routes = new Set();
  }

  // 检查数据库连接状态
  async checkDatabase(): Promise<boolean> {
    try {
      return mongoose.connection.readyState === 1;
    } catch (error) {
      logger.error('数据库健康检查失败:', error);
      return false;
    }
  }

  // 获取系统运行时间
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  // 获取内存使用情况
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  // 记录路由
  registerRoute(method: string, path: string): void {
    this.routes.add(`${method.toUpperCase()} ${path}`);
  }

  // 获取所有注册的路由
  getRoutes(): string[] {
    return Array.from(this.routes);
  }

  // 检查系统整体健康状态
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    database: boolean;
    memory: NodeJS.MemoryUsage;
    environment: string;
    version: string;
    routes: string[];
  }> {
    const dbStatus = await this.checkDatabase();

    return {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      database: dbStatus,
      memory: this.getMemoryUsage(),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      routes: this.getRoutes()
    };
  }

  // 路由监控中间件
  monitorRoute(router: Router): void {
    router.stack.forEach(layer => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route).filter(key => 
          ['get', 'post', 'put', 'delete', 'patch'].includes(key)
        );
        methods.forEach(method => {
          this.registerRoute(method, path);
        });
      }
    });
  }
}

export const healthService = new HealthService(); 