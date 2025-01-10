/**
 * MongoDB 数据库连接管理模块
 * 
 * 该模块实现了MongoDB数据库连接的单例模式,通过全局缓存来复用数据库连接。
 * 主要功能:
 * 1. 缓存数据库连接,避免重复创建连接
 * 2. 处理连接错误和重试
 * 3. 优化连接池配置
 */

import mongoose from 'mongoose';

// 定义缓存连接的接口类型
interface CachedConnection {
  conn: typeof mongoose | null;    // 当前的mongoose连接实例
  promise: Promise<typeof mongoose> | null;  // 正在进行的连接Promise
}

// 在全局作用域中声明mongoose变量类型
declare global {
  var mongoose: CachedConnection | undefined;
}

// 从环境变量获取MongoDB连接URI
const MONGODB_URI = process.env.MONGODB_URI!;

// 验证MongoDB连接URI是否存在
if (!MONGODB_URI) {
  throw new Error('请在环境变量中设置 MONGODB_URI');
}

// 初始化缓存连接对象,优先使用全局缓存,否则创建新的缓存对象
let cached: CachedConnection = (global as any).mongoose || { conn: null, promise: null };

// 确保全局缓存对象存在
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * 连接数据库的异步函数
 * 
 * 实现了以下功能:
 * 1. 如果已存在连接,直接返回该连接
 * 2. 如果正在连接,等待连接完成
 * 3. 如果需要新建连接,使用优化的连接选项
 * 
 * @returns Promise<typeof mongoose> 返回mongoose连接实例
 * @throws 如果连接失败,会抛出错误
 */
export async function connectDB() {
  // 如果已经存在连接,直接返回
  if (cached.conn) {
    return cached.conn;
  }

  // 如果没有正在进行的连接,创建新的连接
  if (!cached.promise) {
    // 配置MongoDB连接选项
    const opts = {
      bufferCommands: true,      // 启用命令缓冲
      maxPoolSize: 10,           // 最大连接池大小
      minPoolSize: 5,            // 最小连接池大小
      socketTimeoutMS: 5000,     // Socket超时时间
      serverSelectionTimeoutMS: 5000,  // 服务器选择超时时间
      family: 4                  // 使用IPv4
    };

    // 创建新的连接Promise
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    // 等待连接完成并缓存连接实例
    cached.conn = await cached.promise;
  } catch (e) {
    // 如果连接失败,清除Promise缓存并抛出错误
    cached.promise = null;
    throw e;
  }

  return cached.conn;
} 