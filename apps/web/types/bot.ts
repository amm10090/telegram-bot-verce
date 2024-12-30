// apps/web/src/types/bot.ts

import { Document, Model, Types } from 'mongoose';

// Bot 命令接口
export interface BotCommand {
  command: string;
  description: string;
}

// Bot 设置接口
export interface BotSettings {
  webhookUrl?: string;
  commands?: BotCommand[];
  allowedUpdates?: string[];
  customizations?: Record<string, unknown>;
}

// Bot菜单项接口
export interface BotMenu {
  _id?: any;  // Mongoose ObjectId
  text: string;
  command: string;
  order: number;
  toObject?: () => any;
}

// 基础 Bot 接口
export interface IBot {
  name: string;
  token: string;
  apiKey: string;
  isEnabled: boolean;
  status: 'active' | 'inactive';
  userId?: Types.ObjectId;
  settings?: BotSettings;
  menus?: BotMenu[];
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
}

// Mongoose Document 类型
export interface IBotDocument extends IBot, Document {
  id: string;
}

// API 请求体类型
export interface BotCreateInput {
  name: string;
  token: string;
  settings?: BotSettings;
}

export interface BotUpdateInput {
  name?: string;
  token?: string;
  isEnabled?: boolean;
  settings?: BotSettings;
}

// API 响应类型
export interface BotResponse {
  id: string;
  name: string;
  token: string;
  apiKey: string;
  isEnabled: boolean;
  status: 'active' | 'inactive';
  settings?: BotSettings;
  menus?: BotMenu[];
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

// 分页查询参数
export interface BotQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: keyof IBot;
  sortOrder?: 'asc' | 'desc';
}

// API 响应包装器
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 分页结果接口
export interface PaginateResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

// 分页选项接口
export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: { [key: string]: number };
  lean?: boolean;
  select?: string | object;
  populate?: string | object;
}

// 扩展的 Model 接口
export interface IBotModel extends Model<IBotDocument> {
  paginate(
    query: any,
    options: PaginateOptions
  ): Promise<PaginateResult<IBotDocument>>;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
