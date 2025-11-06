// 简单的内存缓存实现
interface CacheItem<T> {
  value: T;
  expiry: number;
}

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheItem<unknown>>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
    console.log(`[Cache] 设置缓存: ${key}, TTL: ${ttlSeconds}秒`);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      console.log(`[Cache] 缓存未命中: ${key}`);
      return null;
    }

    if (Date.now() > item.expiry) {
      console.log(`[Cache] 缓存已过期: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] 缓存命中: ${key}`);
    return item.value as T;
  }

  delete(key: string): void {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    if (existed) {
      console.log(`[Cache] 删除缓存: ${key}`);
    }
  }
}

export const cache = Cache.getInstance(); 