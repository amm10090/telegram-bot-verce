// apps/web/src/types/index.ts

/**
 * Bot的基本信息接口
 * 定义了从Telegram API获取的Bot信息结构
 */
export interface BotInfo {
    id: number;                           // Bot的唯一标识符
    is_bot: boolean;                      // 是否是Bot
    first_name: string;                   // Bot的显示名称
    username: string;                     // Bot的用户名
    can_join_groups: boolean;             // 是否可以加入群组
    can_read_all_group_messages: boolean; // 是否可以读取群组消息
    supports_inline_queries: boolean;      // 是否支持内联查询
}

/**
 * Bot在系统中的数据结构
 * 定义了保存在我们系统中的Bot信息
 */
export interface Bot {
    id: string;                  // 系统中的唯一标识符
    name: string;                // Bot名称
    apiKey: string;              // API密钥
    isEnabled: boolean;          // 是否启用
    status: 'active' | 'inactive'; // Bot状态
    createdAt: string;           // 创建时间
    lastUsed?: string;           // 最后使用时间
}

/**
 * API响应的标准格式
 * 使用泛型T来定义响应数据的类型
 */
export interface ApiResponse<T = any> {
    success: boolean;        // 请求是否成功
    data?: T;               // 响应数据
    message?: string;       // 错误信息
    error?: any;           // 错误详情
}

/**
 * Bot创建/更新时的请求数据结构
 */
export interface BotCreateUpdateData {
    name: string;           // Bot名称
    apiKey: string;         // API密钥
    isEnabled: boolean;     // 是否启用
}