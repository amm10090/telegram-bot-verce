import { Router } from 'express';
import { healthService } from '../services/health.service';
import { ResponseUtils } from '../utils/response.utils';

const router = Router();

// 基础健康检查
router.get('/', async (req, res) => {
  const status = await healthService.getHealthStatus();
  ResponseUtils.success(res, status);
});

// Ping 测试
router.get('/ping', (req, res) => {
  const startTime = process.hrtime();
  const endTime = process.hrtime(startTime);
  const responseTime = (endTime[0] * 1e9 + endTime[1]) / 1e6; // 转换为毫秒

  ResponseUtils.success(res, {
    status: 'ok',
    message: 'pong',
    responseTime: `${responseTime.toFixed(2)}ms`
  });
});

// 数据库连接检查
router.get('/database', async (req, res) => {
  const isConnected = await healthService.checkDatabase();
  ResponseUtils.success(res, {
    status: isConnected ? 'connected' : 'disconnected'
  });
});

// 系统资源使用情况
router.get('/metrics', (req, res) => {
  const memory = healthService.getMemoryUsage();
  const uptime = healthService.getUptime();

  ResponseUtils.success(res, {
    uptime: `${(uptime / 1000 / 60).toFixed(2)} minutes`,
    memory: {
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`
    }
  });
});

// 路由列表
router.get('/routes', (req, res) => {
  ResponseUtils.success(res, {
    routes: healthService.getRoutes()
  });
});

export const healthRoutes = router; 