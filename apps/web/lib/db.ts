import mongoose from 'mongoose';

declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
  };
  on(event: string, listener: Function): void;
};

// 配置常量
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tgbot';
const MAX_RETRIES = 3;
const INITIAL_RETRY_INTERVAL = 1000;
const MAX_RETRY_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 10000;
const POOL_SIZE = 2;
const MIN_POOL_SIZE = 2;
const MAX_IDLE_TIME = 60000;
const WAIT_QUEUE_TIMEOUT = 10000;

const isDevelopment = process.env.NODE_ENV !== 'production';

// 日志工具
const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[MongoDB Debug]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.log('[MongoDB Info]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[MongoDB Warn]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[MongoDB Error]', ...args);
  }
};

// 开发环境启用查询日志
if (isDevelopment) {
  mongoose.set('debug', { 
    color: true,
    shell: true 
  });
}

// 设置全局配置
mongoose.set('maxTimeMS', 5000);
mongoose.set('bufferCommands', true);

// 性能监控指标
interface PerformanceMetrics {
  connectTime: number;
  reconnectCount: number;
  lastConnectTime: number;
  averageConnectTime: number;
  failedAttempts: number;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  retryCount: number;
  lastError?: Error;
  metrics: PerformanceMetrics;
}

const state: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  retryCount: 0,
  metrics: {
    connectTime: 0,
    reconnectCount: 0,
    lastConnectTime: 0,
    averageConnectTime: 0,
    failedAttempts: 0
  }
};

function getRetryDelay(retryCount: number): number {
  const delay = Math.min(
    INITIAL_RETRY_INTERVAL * Math.pow(2, retryCount),
    MAX_RETRY_INTERVAL
  );
  return delay + Math.random() * 1000;
}

function updateMetrics(connectTime: number, success: boolean) {
  const metrics = state.metrics;
  metrics.lastConnectTime = connectTime;
  
  if (success) {
    metrics.connectTime = connectTime;
    metrics.reconnectCount++;
    metrics.averageConnectTime = (
      (metrics.averageConnectTime * (metrics.reconnectCount - 1) + connectTime) / 
      metrics.reconnectCount
    );
  } else {
    metrics.failedAttempts++;
  }

  // 只在开发环境或出现异常时记录性能指标
  if (isDevelopment || !success) {
    logger.debug('连接性能指标:', {
      averageConnectTime: `${metrics.averageConnectTime.toFixed(2)}ms`,
      reconnectCount: metrics.reconnectCount,
      failedAttempts: metrics.failedAttempts,
      lastConnectTime: `${metrics.lastConnectTime.toFixed(2)}ms`
    });
  }
}

export async function connectDB(retryCount = 0): Promise<void> {
  if (state.isConnected) {
    return;
  }

  if (state.isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return connectDB(retryCount);
  }

  const startTime = Date.now();
  
  try {
    state.isConnecting = true;

    const options: mongoose.ConnectOptions = {
      bufferCommands: true,
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: POOL_SIZE,
      minPoolSize: MIN_POOL_SIZE,
      connectTimeoutMS: CONNECTION_TIMEOUT,
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: MAX_IDLE_TIME,
      waitQueueTimeoutMS: WAIT_QUEUE_TIMEOUT,
      autoIndex: isDevelopment,
      readPreference: 'primaryPreferred',
      retryWrites: true
    };

    await mongoose.connect(MONGODB_URI!, options);
    
    const connectTime = Date.now() - startTime;
    updateMetrics(connectTime, true);
    
    state.isConnected = true;
    state.isConnecting = false;
    state.retryCount = 0;
    state.lastError = undefined;
    
    logger.info(`连接成功 (${connectTime}ms)`);

    mongoose.connection.on('error', handleConnectionError);
    mongoose.connection.on('disconnected', handleDisconnection);
    mongoose.connection.on('reconnected', () => {
      logger.info('重连成功');
    });

    // 只在开发环境监控连接状态
    if (isDevelopment) {
      setInterval(() => {
        const readyState = mongoose.connection.readyState;
        if (readyState !== 1) {  // 只在非连接状态时记录
          logger.debug('连接状态:', {
            readyState,
            status: ['已断开', '已连接', '连接中', '断开中'][readyState] || '未知'
          });
        }
      }, 30000);
    }

  } catch (error) {
    const connectTime = Date.now() - startTime;
    updateMetrics(connectTime, false);
    
    state.isConnecting = false;
    state.lastError = error as Error;

    if (retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount);
      logger.warn(`连接失败，${(delay / 1000).toFixed(1)}秒后重试(${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }

    logger.error('连接失败，已达到最大重试次数:', error);
    throw new Error(`数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

function handleConnectionError(error: Error) {
  logger.error('连接错误:', error);
  if (state.isConnected) {
    state.isConnected = false;
    handleDisconnection();
  }
}

async function handleDisconnection() {
  if (!state.isConnected) return;
  
  logger.warn('连接断开，尝试重新连接...');
  state.isConnected = false;
  state.retryCount = 0;
  
  try {
    await connectDB();
  } catch (error) {
    logger.error('重新连接失败:', error);
  }
}

export async function disconnectDB(): Promise<void> {
  if (!state.isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    state.isConnected = false;
    state.isConnecting = false;
    logger.info('断开连接成功');
  } catch (error) {
    logger.error('断开连接失败:', error);
    throw new Error(`断开连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

['SIGTERM', 'SIGINT', 'beforeExit'].forEach((signal) => {
  process.on(signal, async () => {
    await disconnectDB();
  });
}); 