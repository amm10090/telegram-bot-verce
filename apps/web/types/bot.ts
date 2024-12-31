// apps/web/src/types/bot.ts

import { Document, Model, Types } from 'mongoose';

// 按钮接口
export interface Button {
  text: string;
  type: 'url' | 'callback';
  value: string;
}

// 按钮布局接口
export interface ButtonLayout {
  buttons: Button[][];
}

// 响应类型枚举
export enum ResponseType {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  HTML = 'html',
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document',
  INLINE_BUTTONS = 'inline_buttons',
  KEYBOARD = 'keyboard'
}

// 响应配置接口
export interface CommandResponse {
  types: ResponseType[];
  content: string;
  buttons?: ButtonLayout;
  parseMode?: 'Markdown' | 'HTML';
  mediaUrl?: string;
  caption?: string;
  inputPlaceholder?: string;
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  selective?: boolean;
}

// 菜单项接口
export interface MenuItem {
  id?: string;
  text: string;
  command: string;
  url?: string;
  order: number;
  response?: CommandResponse;
}

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

// Bot 接口
export interface IBot {
  id?: string;
  name: string;
  token: string;
  apiKey: string;
  isEnabled: boolean;
  status: 'active' | 'inactive';
  userId?: string;
  settings?: BotSettings;
  menus: MenuItem[];
  createdAt?: Date;
  updatedAt?: Date;
  lastUsed?: Date;
}

// Mongoose Document 接口
export interface IBotDocument extends IBot, Document {
  id: string;
}

// Mongoose Model 接口
export interface IBotModel extends Model<IBotDocument> {
  paginate(
    query: any,
    options: PaginateOptions
  ): Promise<PaginateResult<IBotDocument>>;
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

// API 响应接口
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

export interface BotResponse {
  id: string;
  name: string;
  token: string;
  apiKey: string;
  isEnabled: boolean;
  status: string;
  settings: any;
  menus: MenuItem[];
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

// Bot 创建和更新接口
export interface BotCreateInput {
  name: string;
  token: string;
  settings?: BotSettings;
}

export interface BotUpdateInput extends Partial<BotCreateInput> {
  isEnabled?: boolean;
  status?: 'active' | 'inactive';
}

export interface BotQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
