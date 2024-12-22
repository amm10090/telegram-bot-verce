// apps/web/src/types/bot.ts

/**
 * API响应的标准格式
 * 使用泛型T来定义响应数据的类型
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T = any> {
    success: boolean;        // 请求是否成功
    data?: T;               // 响应数据
    message?: string;       // 消息提示
    error?: any;           // 错误详情
    errorCode?: string;    // 业务错误代码
}

/**
 * Telegram Bot的基本信息
 * 这个接口定义了从Telegram API获取的Bot信息结构
 */
export interface BotInfo {
    id: number;                           // Bot的Telegram ID
    is_bot: boolean;                      // 是否是Bot账号
    first_name: string;                   // Bot的显示名称
    username: string;                     // Bot的用户名
    can_join_groups: boolean;             // 是否可以加入群组
    can_read_all_group_messages: boolean; // 是否可以读取所有群组消息
    supports_inline_queries: boolean;      // 是否支持内联查询
}

/**
 * 系统中Bot的基本数据结构
 * 定义了在我们系统中存储的Bot信息
 */
export interface Bot {
    id: string;                   // 系统中的唯一标识符
    name: string;                 // Bot名称
    apiKey: string;               // API密钥
    isEnabled: boolean;           // 是否启用
    status: 'active' | 'inactive'; // Bot状态
    createdAt: string;            // 创建时间
    lastUsed?: string;            // 最后使用时间，可选
}

/**
 * API返回的原始Bot数据结构
 * 定义了从MongoDB直接获取的原始数据格式
 */
export interface RawBotData {
    _id: string;           // MongoDB的默认ID字段
    name: string;          // Bot名称
    apiKey: string;        // API密钥
    isEnabled: boolean;    // 是否启用
    status?: string;       // Bot状态，可选
    createdAt: string;     // 创建时间
    lastUsed?: string;     // 最后使用时间，可选
}
// 扩展ApiResponse接口，添加分页支持
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
    total: number;         // 数据总数
    page: number;         // 当前页码
    pageSize: number;     // 每页数据条数
}

// 扩展现有的Bot数据接口，添加元数据支持
export interface EnhancedBotData extends RawBotData {
    metadata?: {
        lastChecked?: string;    // 最后检查时间
        lastActive?: string;     // 最后活跃时间
        // 其他元数据字段可以在此扩展
    };
}

/**
 * API的嵌套响应结构
 * 定义了API返回的多层嵌套数据结构
 */
export interface ApiNestedResponse {
    success: boolean;                  // 请求是否成功
    data: {
        data: RawBotData[];           // Bot数据数组
        message?: string;             // 数据层消息，可选
    };
    message?: string;                 // 响应层消息，可选
}

/**
 * Bot创建/更新请求的数据结构
 */
export interface BotCreateUpdateData {
    name: string;           // Bot名称
    apiKey: string;         // API密钥
    isEnabled: boolean;     // 是否启用
}

/**
 * 表格显示用的Bot数据结构
 * 扩展自基础Bot接口，添加了表格显示所需的额外字段
 */
export interface TableBot extends Bot {
    type: 'telegram' | 'other';    // Bot类型，用于表格显示
}

/**
 * Bot的API响应格式
 * 专门用于处理Bot相关的API响应
 */
export interface BotListResponse extends ApiResponse<RawBotData[]> {
    // 继承自ApiResponse，但指定data为RawBotData数组
}
