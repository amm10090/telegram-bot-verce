import mongoose from 'mongoose';

declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
  };
  on(event: string, listener: Function): void;
};

// 如果没有设置环境变量，使用默认的本地数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tgbot';
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

// 修改错误提示，添加默认连接信息
if (!process.env.MONGODB_URI) {
  console.warn('未设置 MONGODB_URI 环境变量，将使用默认本地数据库连接: mongodb://localhost:27017/tgbot');
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  retryCount: number;
  lastError?: Error;
}

const state: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  retryCount: 0,
};

/**
 * 连接数据库
 * @param retryCount 当前重试次数
 * @returns Promise<void>
 */
export async function connectDB(retryCount = 0): Promise<void> {
  // 如果已经连接，直接返回
  if (state.isConnected) {
    return;
  }

  // 如果正在连接中，等待
  if (state.isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return connectDB(retryCount);
  }

  try {
    state.isConnecting = true;

    // 设置连接选项
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // 强制使用 IPv4
    };

    await mongoose.connect(MONGODB_URI!, options);
    
    state.isConnected = true;
    state.isConnecting = false;
    state.retryCount = 0;
    state.lastError = undefined;
    
    console.log('MongoDB连接成功');

    // 监听连接错误
    mongoose.connection.on('error', handleConnectionError);
    mongoose.connection.on('disconnected', handleDisconnection);

  } catch (error) {
    state.isConnecting = false;
    state.lastError = error as Error;

    if (retryCount < MAX_RETRIES) {
      console.warn(`MongoDB连接失败，${RETRY_INTERVAL / 1000}秒后重试(${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectDB(retryCount + 1);
    }

    console.error('MongoDB连接失败，已达到最大重试次数:', error);
    throw new Error(`数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 处理连接错误
 */
function handleConnectionError(error: Error) {
  console.error('MongoDB连接错误:', error);
  if (state.isConnected) {
    state.isConnected = false;
    handleDisconnection();
  }
}

/**
 * 处理断开连接
 */
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

/**
 * 断开数据库连接
 */
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

// 监听进程退出事件
['SIGTERM', 'SIGINT', 'beforeExit'].forEach((signal) => {
  process.on(signal, async () => {
    await disconnectDB();
  });
}); 