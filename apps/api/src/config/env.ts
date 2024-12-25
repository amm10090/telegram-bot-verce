import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 环境变量类型定义
interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  API_BASE_URL: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
}

// 环境变量配置
export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telegram-bot',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

// 验证环境变量
function validateEnv(config: EnvConfig) {
  // 必需的环境变量
  const requiredVars = ['MONGODB_URI'] as const;
  for (const key of requiredVars) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // 端口号验证
  if (isNaN(config.PORT) || config.PORT <= 0 || config.PORT > 65535) {
    throw new Error(`Invalid PORT: ${config.PORT}. Must be between 1 and 65535`);
  }

  // URL 格式验证
  try {
    new URL(config.API_BASE_URL);
    new URL(config.CORS_ORIGIN);
  } catch {
    throw new Error('Invalid API_BASE_URL or CORS_ORIGIN format');
  }

  return config;
}

// 验证并导出环境配置
export default validateEnv(env); 