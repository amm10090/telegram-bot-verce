export interface BotInfo {
  id: string;
  name: string;
  username?: string;
  description?: string;
}

export interface Bot extends BotInfo {
  isEnabled: boolean;
  status: 'active' | 'inactive';
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  owner: string;
  settings: BotSettings;
  metadata: BotMetadata;
}

export interface BotSettings {
  allowGroups: boolean;
  allowChannels: boolean;
  commandPrefix: string;
  customCommands: CustomCommand[];
}

export interface CustomCommand {
  command: string;
  description: string;
  response: string;
}

export interface BotMetadata {
  totalUsers: number;
  totalMessages: number;
  totalCommands: number;
}

export interface BotCreateData {
  name: string;
  token: string;
  description?: string;
  owner: string;
  settings?: Partial<BotSettings>;
}

export interface BotUpdateData {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  settings?: Partial<BotSettings>;
}

export interface BotQueryParams {
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof Bot;
  sortOrder?: 'asc' | 'desc';
}

export interface BotValidationResult {
  isValid: boolean;
  botInfo?: BotInfo;
  error?: string;
}

export interface BotWebhookConfig {
  url: string;
  certificate?: string;
  maxConnections?: number;
  allowedUpdates?: string[];
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

// 分页响应类型
export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  total: number;
  page: number;
  pageSize: number;
} 