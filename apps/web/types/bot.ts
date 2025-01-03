// apps/web/src/types/bot.ts

import { Document, Model, Types } from 'mongoose';

/**
 * 按钮接口定义
 * @interface Button
 * @property {string} text - 按钮显示的文本
 * @property {'url' | 'callback'} type - 按钮类型，可以是链接或回调
 * @property {string} value - 按钮的值，对于 url 类型是链接，对于 callback 类型是回调数据
 */
export interface Button {
  text: string;
  type: 'url' | 'callback';
  value: string;
}

/**
 * 按钮布局接口，定义按钮的二维数组排列
 * @interface ButtonLayout
 * @property {Button[][]} buttons - 二维按钮数组，表示按钮的行列布局
 */
export interface ButtonLayout {
  buttons: Button[][];
}

/**
 * 响应类型枚举，定义所有支持的响应类型
 * @enum {string} ResponseType
 */
export enum ResponseType {
  TEXT = 'text',           // 纯文本消息
  MARKDOWN = 'markdown',   // Markdown 格式文本
  HTML = 'html',          // HTML 格式文本
  PHOTO = 'photo',        // 图片消息
  VIDEO = 'video',        // 视频消息
  DOCUMENT = 'document',  // 文档消息
  INLINE_BUTTONS = 'inline_buttons',  // 内联按钮
  KEYBOARD = 'keyboard'   // 键盘按钮
}

/**
 * 命令响应接口，定义机器人对命令的响应内容
 * @interface CommandResponse
 */
export interface CommandResponse {
  types: ResponseType[];           // 响应类型数组
  content: string;                 // 响应内容
  buttons?: ButtonLayout;          // 可选的按钮布局
  parseMode?: 'Markdown' | 'HTML'; // 内容解析模式
  mediaUrl?: string;              // 媒体文件URL
  caption?: string;               // 媒体文件说明文字
  inputPlaceholder?: string;      // 输入框占位文本
  resizeKeyboard?: boolean;       // 是否调整键盘大小
  oneTimeKeyboard?: boolean;      // 是否为一次性键盘
  selective?: boolean;            // 是否选择性显示
}

/**
 * 菜单项接口，定义机器人的菜单项结构
 * @interface MenuItem
 */
export interface MenuItem {
  _id?: Types.ObjectId;          // MongoDB ID
  id?: string;                   // 菜单项ID
  text: string;                  // 显示文本
  command: string;               // 命令文本
  order: number;                 // 排序序号
  response?: CommandResponse;    // 命令响应配置
}

/**
 * 机器人命令接口，定义命令的基本结构
 * @interface BotCommand
 */
export interface BotCommand {
  command: string;                // 命令名称
  description: string;            // 命令描述
}

/**
 * 机器人设置接口，定义机器人的配置选项
 * @interface BotSettings
 */
export interface BotSettings {
  webhookUrl?: string;           // Webhook URL
  commands?: BotCommand[];       // 命令列表
  allowedUpdates?: string[];     // 允许的更新类型
  customizations?: Record<string, unknown>;  // 自定义配置
  accessControl?: {
    enabled: boolean;
    defaultPolicy: 'allow' | 'deny';
    whitelistOnly: boolean;
  };
  autoReply?: {
    enabled: boolean;
    maxRulesPerBot: number;
  };
}

/**
 * 机器人基础接口，定义机器人的基本信息
 * @interface IBot
 */
export interface IBot {
  id?: string;                   // 机器人ID
  name: string;                  // 机器人名称
  token: string;                 // Telegram Bot Token
  apiKey: string;                // API密钥
  isEnabled: boolean;            // 是否启用
  status: 'active' | 'inactive'; // 状态
  userId?: string;               // 所属用户ID
  settings?: BotSettings;        // 机器人设置
  menus: MenuItem[];            // 菜单列表
  createdAt?: Date;             // 创建时间
  updatedAt?: Date;             // 更新时间
  lastUsed?: Date;              // 最后使用时间
}

/**
 * Bot配置文件接口
 * @interface BotProfile
 */
export interface BotProfile {
  description?: string;
  shortDescription?: string;
  avatarUrl?: string;
  username?: string;
  languageCode?: string;
  about?: string;
}

/**
 * 自动回复规则接口
 * @interface AutoReplyRule
 */
export interface AutoReplyRule {
  name: string;
  type: 'keyword' | 'regex';
  triggers: string[];
  isEnabled: boolean;
  priority: number;
  response: CommandResponse;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 访问控制项接口
 * @interface AccessControl
 */
export interface AccessControl {
  type: 'user' | 'group';
  id: string;
  name?: string;
  listType: 'whitelist' | 'blacklist';
  reason?: string;
  expireAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mongoose文档接口，扩展IBot接口
 * @interface IBotDocument
 */
export interface IBotDocument extends Document {
  name: string;
  token: string;
  apiKey: string;
  isEnabled: boolean;
  status: 'active' | 'inactive';
  userId?: string;
  profile?: BotProfile;
  settings?: BotSettings;
  menus: MenuItem[];
  autoReplies?: AutoReplyRule[];
  accessControls?: AccessControl[];
  lastUsed?: Date;
  setWebhook(): Promise<boolean>;
}

/**
 * Mongoose模型接口，包含分页功能
 * @interface IBotModel
 */
export interface IBotModel extends Model<IBotDocument> {
  paginate(
    query: any,
    options: PaginateOptions
  ): Promise<PaginateResult<IBotDocument>>;
}

/**
 * 分页选项接口
 * @interface PaginateOptions
 */
export interface PaginateOptions {
  page?: number;                 // 页码
  limit?: number;                // 每页限制
  sort?: { [key: string]: number }; // 排序选项
  lean?: boolean;                // 是否返回普通对象
  select?: string | object;      // 字段选择
  populate?: string | object;    // 关联填充
}

/**
 * 分页结果接口
 * @interface PaginateResult
 */
export interface PaginateResult<T> {
  docs: T[];                     // 文档列表
  totalDocs: number;             // 总文档数
  limit: number;                 // 每页限制
  totalPages: number;            // 总页数
  page: number;                  // 当前页码
  pagingCounter: number;         // 分页计数器
  hasPrevPage: boolean;          // 是否有上一页
  hasNextPage: boolean;          // 是否有下一页
  prevPage: number | null;       // 上一页页码
  nextPage: number | null;       // 下一页页码
}

/**
 * API响应接口
 * @interface ApiResponse
 */
export interface ApiResponse<T> {
  success: boolean;              // 是否成功
  data: T;                       // 响应数据
  message?: string;              // 响应消息
  error?: string;                // 错误信息
  pagination?: {                 // 分页信息
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 机器人响应接口，用于API返回
 * @interface BotResponse
 */
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

/**
 * 机器人创建输入接口
 * @interface BotCreateInput
 */
export interface BotCreateInput {
  name: string;                  // 机器人名称
  token: string;                 // Telegram Bot Token
  settings?: BotSettings;        // 可选的机器人设置
}

/**
 * 机器人更新输入接口
 * @interface BotUpdateInput
 */
export interface BotUpdateInput extends Partial<BotCreateInput> {
  isEnabled?: boolean;           // 是否启用
  status?: 'active' | 'inactive'; // 状态
}

/**
 * 机器人查询参数接口
 * @interface BotQueryParams
 */
export interface BotQueryParams {
  page?: number;                 // 页码
  limit?: number;                // 每页限制
  search?: string;               // 搜索关键词
  status?: string;               // 状态筛选
  sortBy?: string;               // 排序字段
  sortOrder?: 'asc' | 'desc';    // 排序方向
}

/**
 * 分页API响应接口
 * @interface PaginatedApiResponse
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: {                  // 分页信息
    total: number;              // 总数
    page: number;               // 当前页
    limit: number;              // 每页限制
    totalPages: number;         // 总页数
  };
}
