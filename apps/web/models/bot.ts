/**
 * Bot 模型定义文件
 * 该文件定义了 Telegram Bot 的数据模型结构和相关方法
 * 包含了机器人的基本信息、菜单配置、按钮设置和响应处理等核心功能
 */

import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { IBotDocument, IBotModel, ResponseType } from '@/types/bot';

// 防止热重载时的模型重复定义
if (mongoose.models.Bot) {
  delete mongoose.models.Bot;
}

/**
 * 按钮 Schema 定义
 * @description 定义机器人交互按钮的数据结构
 * @property {string} text - 按钮显示的文本内容
 * @property {string} type - 按钮类型：url(链接跳转)或callback(回调处理)
 * @property {string} value - 按钮值：url类型存储链接，callback类型存储回调数据
 */
const buttonSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['url', 'callback'], required: true },
  value: { type: String, required: true }
}, { _id: false });

/**
 * 响应 Schema 定义
 * @description 定义机器人对用户交互的响应数据结构
 * @property {string[]} types - 支持的响应类型数组
 * @property {string} content - 响应的具体内容
 * @property {object} buttons - 响应附带的按钮配置
 * @property {string} parseMode - 内容解析模式：支持Markdown或HTML
 * @property {string} mediaUrl - 媒体文件的URL地址
 * @property {string} caption - 媒体文件的说明文本
 * @property {string} inputPlaceholder - 用户输入框的占位提示文本
 * @property {boolean} resizeKeyboard - 是否自动调整键盘大小
 * @property {boolean} oneTimeKeyboard - 是否为一次性键盘（使用后自动隐藏）
 * @property {boolean} selective - 是否选择性地向特定用户显示
 */
const responseSchema = new mongoose.Schema({
  types: [{
    type: String,
    enum: ['text', 'markdown', 'html', 'photo', 'video', 'document', 'inline_buttons', 'keyboard'],
    required: true
  }],
  content: { type: String, required: true },
  buttons: {
    buttons: [[buttonSchema]]
  },
  parseMode: { type: String, enum: ['Markdown', 'HTML'] },
  mediaUrl: String,
  caption: String,
  inputPlaceholder: String,
  resizeKeyboard: Boolean,
  oneTimeKeyboard: Boolean,
  selective: Boolean
}, { _id: false });

/**
 * 菜单项 Schema 定义
 * @description 定义机器人命令菜单的数据结构
 * @property {string} text - 菜单项显示的文本
 * @property {string} command - 触发菜单项的命令
 * @property {number} order - 菜单项的显示顺序
 * @property {object} response - 菜单项触发后的响应配置
 * @property {ObjectId} _id - 菜单项的唯一标识符
 */
const menuSchema = new mongoose.Schema({
  text: { type: String, required: true },
  command: { type: String, required: true },
  order: { type: Number, required: true },
  response: responseSchema,
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
}, { _id: false });

/**
 * 自动回复规则 Schema 定义
 * @description 定义机器人的自动回复规则结构
 * @property {string} name - 规则名称
 * @property {string} type - 触发类型：keyword(关键词)、regex(正则表达式)
 * @property {string[]} triggers - 触发条件（关键词列表或正则表达式）
 * @property {boolean} isEnabled - 规则是否启用
 * @property {number} priority - 规则优先级（数字越大优先级越高）
 * @property {object} response - 触发后的响应配置
 */
const autoReplySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['keyword', 'regex'], required: true },
  triggers: [{ type: String, required: true }],
  isEnabled: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  response: responseSchema
}, { timestamps: true });

/**
 * 访问控制 Schema 定义
 * @description 定义用户和群组的访问控制列表
 * @property {string} type - 控制类型：user(用户)、group(群组)
 * @property {string} id - Telegram ID
 * @property {string} name - 用户名或群组名称
 * @property {string} listType - 列表类型：whitelist(白名单)、blacklist(黑名单)
 * @property {string} reason - 添加原因
 * @property {Date} expireAt - 过期时间（可选）
 */
const accessControlSchema = new mongoose.Schema({
  type: { type: String, enum: ['user', 'group'], required: true },
  id: { type: String, required: true },
  name: { type: String },
  listType: { type: String, enum: ['whitelist', 'blacklist'], required: true },
  reason: String,
  expireAt: Date
}, { timestamps: true });

/**
 * Bot Schema 主模型定义
 * @description 定义完整的机器人数据模型，包含所有配置和功能
 * @property {string} name - 机器人名称
 * @property {string} token - Telegram Bot API 访问令牌
 * @property {string} apiKey - 自定义API密钥，用于接口认证
 * @property {boolean} isEnabled - 机器人是否启用
 * @property {string} status - 机器人当前状态
 * @property {ObjectId} userId - 机器人所属用户ID
 * @property {object} settings - 机器人全局设置
 * @property {array} menus - 机器人的菜单配置列表
 * @property {Date} lastUsed - 最后使用时间
 */
const botSchema = new mongoose.Schema<IBotDocument>(
  {
    name: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    apiKey: { type: String, required: true, unique: true },
    isEnabled: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: false },
    // 扩充机器人基本信息
    profile: {
      description: String, // 机器人介绍
      shortDescription: String, // 简短介绍
      avatarUrl: String, // 头像URL
      username: String, // 机器人用户名
      languageCode: { type: String, default: 'zh-CN' }, // 机器人语言
      about: String // 关于信息
    },
    settings: {
      webhookUrl: String,
      commands: [{
        command: String,
        description: String
      }],
      allowedUpdates: [String],
      customizations: mongoose.Schema.Types.Mixed,
      // 访问控制设置
      accessControl: {
        enabled: { type: Boolean, default: false },
        defaultPolicy: { type: String, enum: ['allow', 'deny'], default: 'allow' },
        whitelistOnly: { type: Boolean, default: false }
      },
      // 自动回复设置
      autoReply: {
        enabled: { type: Boolean, default: true },
        maxRulesPerBot: { type: Number, default: 50 }
      }
    },
    menus: [menuSchema],
    // 添加自动回复规则列表
    autoReplies: [autoReplySchema],
    // 添加访问控制列表
    accessControls: [accessControlSchema],
    lastUsed: { type: Date }
  },
  {
    timestamps: true // 自动管理创建时间和更新时间
  }
);

// 添加分页插件支持
botSchema.plugin(mongoosePaginate);

// 添加数据库索引以优化查询性能
botSchema.index({ userId: 1 });
botSchema.index({ 'menus._id': 1 });
botSchema.index({ 'menus.order': 1 });
botSchema.index({ 'menus.command': 1 });

// 添加新的索引
botSchema.index({ 'autoReplies.triggers': 1 });
botSchema.index({ 'accessControls.id': 1, 'accessControls.type': 1 });

// 创建并导出Bot模型
const BotModel = mongoose.model<IBotDocument, IBotModel>('Bot', botSchema);

export default BotModel; 