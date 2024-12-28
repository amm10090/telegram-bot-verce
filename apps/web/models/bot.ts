import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { IBotDocument, IBotModel } from '@/types/bot';

// 定义菜单项 Schema
const menuItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  command: { type: String, required: true },
  order: { type: Number, default: 0 },
  isEnabled: { type: Boolean, default: true }
});

// 定义 Bot Schema
const botSchema = new mongoose.Schema<IBotDocument>(
  {
    name: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    apiKey: { type: String, required: true, unique: true },
    isEnabled: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    settings: {
      webhookUrl: String,
      commands: [{
        command: String,
        description: String
      }],
      allowedUpdates: [String],
      customizations: mongoose.Schema.Types.Mixed
    },
    menus: [menuItemSchema],
    lastUsed: { type: Date }
  },
  {
    timestamps: true,
  }
);

// 添加分页插件
botSchema.plugin(mongoosePaginate);

// 确保模型只被注册一次
let BotModel: IBotModel;

try {
  // 尝试获取已存在的模型
  BotModel = mongoose.model<IBotDocument, IBotModel>('Bot');
} catch {
  // 如果模型不存在，则创建新模型
  BotModel = mongoose.model<IBotDocument, IBotModel>('Bot', botSchema);
}

export default BotModel; 