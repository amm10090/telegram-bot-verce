import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { botRoutes } from './routes/telegram/bot.routes';
import { healthRoutes } from './routes/health.routes';
import { healthService } from './services/health.service';
import { logger, httpLogStream } from './utils/logger';
import { ResponseUtils } from './utils/response.utils';

// 创建Express应用
const app = express();

// 基础中间件
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: httpLogStream }));

// API路由
app.use('/api/bot/telegram', botRoutes);
app.use('/health', healthRoutes);

// 监控所有已注册的路由
healthService.monitorRoute(botRoutes);
healthService.monitorRoute(healthRoutes);

// 404处理
app.use((req, res) => {
  ResponseUtils.notFound(res, '请求的资源不存在');
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('未捕获的错误:', err);

  if (err.name === 'ValidationError') {
    return ResponseUtils.badRequest(res, err.message);
  }
  if (err.name === 'UnauthorizedError') {
    return ResponseUtils.unauthorized(res, err.message);
  }
  if (err.name === 'ForbiddenError') {
    return ResponseUtils.forbidden(res, err.message);
  }
  if (err.name === 'NotFoundError') {
    return ResponseUtils.notFound(res, err.message);
  }

  return ResponseUtils.internalError(res, '服务器内部错误', err);
});

// 启动服务器
const startServer = async () => {
  try {
    await connectDatabase();
    logger.info('数据库连接成功');

    const server = app.listen(env.PORT, () => {
      logger.info(`服务器已启动，监听端口 ${env.PORT}`);
    });

    const gracefulShutdown = async () => {
      logger.info('正在关闭服务器...');
      server.close(async () => {
        try {
          await mongoose.disconnect();
          logger.info('数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          logger.error('关闭数据库连接时出错:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer(); 