import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn (classNames) 工具函数
 * 合并多个类名并解决 Tailwind 类名冲突
 * cd
 * 使用示例:
 * cn('base-class', condition && 'conditional-class', { 'object-class': true })
 * 
 * @param inputs - 要合并的类名数组
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 判断是否为浏览器环境
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * 从 localStorage 获取值，带类型安全检查
 */
export function getLocalStorage<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return fallback;
  }
}

/**
 * 安全地设置 localStorage 值
 */
export function setLocalStorage(key: string, value: unknown): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error setting localStorage key "${key}":`, err);
  }
}