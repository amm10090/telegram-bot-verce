/**
 * Bot 模型定义文件
 * 定义了 Telegram Bot 的数据模型结构，包括按钮、响应、菜单等组件
 * 使用 Mongoose 作为 ODM (Object Document Mapper)
 */

import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { IBotDocument, IBotModel, ResponseType } from '@/types/bot';

// 删除所有已编译的模型，防止热重载时的模型重复定义
if (mongoose.models.Bot) {
  delete mongoose.models.Bot;
}

/**
 * 按钮 Schema
 * 定义了按钮的基本结构，包括文本、类型和值
 * @property {string} text - 按钮显示的文本
 * @property {string} type - 按钮类型，可以是 url 或 callback
 * @property {string} value - 按钮的值，URL链接或回调数据
 */
const buttonSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['url', 'callback'], required: true },
  value: { type: String, required: true }
}, { _id: false });

/**
 * 响应 Schema
 * 定义了机器人响应的结构，支持多种响应类型和配置选项
 * @property {string[]} types - 响应类型数组
 * @property {string} content - 响应内容
 * @property {object} buttons - 按钮布局配置
 * @property {string} parseMode - 内容解析模式
 * @property {string} mediaUrl - 媒体文件URL
 * @property {string} caption - 媒体文件说明
 * @property {string} inputPlaceholder - 输入框占位文本
 * @property {boolean} resizeKeyboard - 是否自动调整键盘大小
 * @property {boolean} oneTimeKeyboard - 是否为一次性键盘
 * @property {boolean} selective - 是否选择性显示
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
 * 菜单项 Schema
 * 定义了机器人菜单项的结构
 * @property {string} text - 菜单项显示文本
 * @property {string} command - 菜单命令
 * @property {string} url - 可选的URL链接
 * @property {number} order - 排序序号
 * @property {object} response - 响应配置
 * @property {ObjectId} _id - 菜单项ID
 */
const menuSchema = new mongoose.Schema({
  text: { type: String, required: true },
  command: { type: String, required: true },
  url: String,
  order: { type: Number, required: true },
  response: responseSchema,
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
}, { _id: false });

/**
 * Bot Schema
 * 定义了机器人的主要数据结构
 * @property {string} name - 机器人名称
 * @property {string} token - Telegram Bot Token
 * @property {string} apiKey - API密钥
 * @property {boolean} isEnabled - 是否启用
 * @property {string} status - 机器人状态
 * @property {ObjectId} userId - 所属用户ID
 * @property {object} settings - 机器人设置
 * @property {array} menus - 菜单列表
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
    settings: {
      webhookUrl: String,
      commands: [{
        command: String,
        description: String
      }],
      allowedUpdates: [String],
      customizations: mongoose.Schema.Types.Mixed
    },
    menus: [menuSchema],
    lastUsed: { type: Date }
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
  }
);

// 添加分页插件，支持分页查询
botSchema.plugin(mongoosePaginate);

/**
 * 数据迁移中间件
 * 在保存文档前执行，用于处理旧格式数据到新格式的迁移
 * 主要处理响应数据格式的变更
 */
botSchema.pre('save', function(next) {
  // 迁移旧的响应数据到新格式
  if (this.menus) {
    this.menus = this.menus.map(menu => {
      if (menu.response && !menu.response.types) {
        const oldResponse = menu.response as any;
        menu.response = {
          types: [oldResponse.type || 'text'],
          content: oldResponse.content || '',
          buttons: oldResponse.buttons,
          parseMode: oldResponse.parseMode,
          mediaUrl: oldResponse.mediaUrl,
          caption: oldResponse.caption
        };
      }
      return menu;
    });
  }
  next();
});

// 添加索引以优化查询性能
botSchema.index({ userId: 1 });
botSchema.index({ 'menus.command': 1 });

// 创建并导出 Bot 模型
const BotModel = mongoose.model<IBotDocument, IBotModel>('Bot', botSchema);

export default BotModel; 