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
const MAX_RETRIES = 3;  // 增加最大重试次数
const INITIAL_RETRY_INTERVAL = 1000;  // 初始重试间隔 1 秒
const MAX_RETRY_INTERVAL = 30000;  // 最大重试间隔 30 秒
const CONNECTION_TIMEOUT = 10000;  // 连接超时时间 10 秒
const POOL_SIZE = 2;  // 增加连接池大小
const MIN_POOL_SIZE = 2;  // 最小连接数
const MAX_IDLE_TIME = 60000;  // 空闲连接最大存活时间
const WAIT_QUEUE_TIMEOUT = 10000;  // 等待队列超时时间

// 开发环境启用查询日志
if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', { 
    color: true,
    shell: true 
  });
}

// 设置全局配置
mongoose.set('maxTimeMS', 5000);  // 查询超时时间
mongoose.set('bufferCommands', true);  // 启用命令缓冲

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

// 计算指数退避时间
function getRetryDelay(retryCount: number): number {
  const delay = Math.min(
    INITIAL_RETRY_INTERVAL * Math.pow(2, retryCount),
    MAX_RETRY_INTERVAL
  );
  return delay + Math.random() * 1000; // 添加随机抖动
}

// 更新性能指标
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

  // 记录性能指标
  console.log('MongoDB连接性能指标:', {
    averageConnectTime: `${metrics.averageConnectTime.toFixed(2)}ms`,
    reconnectCount: metrics.reconnectCount,
    failedAttempts: metrics.failedAttempts,
    lastConnectTime: `${metrics.lastConnectTime.toFixed(2)}ms`
  });
}

export async function connectDB(retryCount = 0): Promise<void> {
  // 如果已经连接，直接返回
  if (state.isConnected) {
    return;
  }

  // 如果正在连接中，等待后重试
  if (state.isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return connectDB(retryCount);
  }

  const startTime = Date.now();
  
  try {
    state.isConnecting = true;

    // 优化的连接选项
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
      autoIndex: process.env.NODE_ENV !== 'production',
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
    
    console.log(`MongoDB连接成功 (${connectTime}ms)`);

    // 监听连接事件
    mongoose.connection.on('error', handleConnectionError);
    mongoose.connection.on('disconnected', handleDisconnection);
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB重连成功');
    });

    // 监控连接状态
    setInterval(() => {
      if (mongoose.connection.readyState === 1) {  // 1 = connected
        console.log('MongoDB连接状态: 已连接');
      } else {
        console.log('MongoDB连接状态:', {
          readyState: mongoose.connection.readyState,
          // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
          status: ['已断开', '已连接', '连接中', '断开中'][mongoose.connection.readyState] || '未知'
        });
      }
    }, 30000);

  } catch (error) {
    const connectTime = Date.now() - startTime;
    updateMetrics(connectTime, false);
    
    state.isConnecting = false;
    state.lastError = error as Error;

    if (retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount);
      console.warn(`MongoDB连接失败，${(delay / 1000).toFixed(1)}秒后重试(${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }

    console.error('MongoDB连接失败，已达到最大重试次数:', error);
    throw new Error(`数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

function handleConnectionError(error: Error) {
  console.error('MongoDB连接错误:', error);
  if (state.isConnected) {
    state.isConnected = false;
    handleDisconnection();
  }
}

async function handleDisconnection() {
  if (!state.isConnected) return;
  
  console.warn('MongoDB连接断开，尝试重新连接...');
  state.isConnected = false;
  state.retryCount = 0;
  
  try {
    await connectDB();
  } catch (error) {
    console.error('重新连接失败:', error);
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
    console.log('MongoDB断开连接成功');
  } catch (error) {
    console.error('MongoDB断开连接失败:', error);
    throw new Error(`断开连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 监听进程退出事件，确保正确关闭连接
['SIGTERM', 'SIGINT', 'beforeExit'].forEach((signal) => {
  process.on(signal, async () => {
    await disconnectDB();
  });
}); 