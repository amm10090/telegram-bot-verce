import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { IBotDocument, IBotModel, ResponseType } from '@/types/bot';

// 删除所有已编译的模型
if (mongoose.models.Bot) {
  delete mongoose.models.Bot;
}

// 按钮 Schema
const buttonSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['url', 'callback'], required: true },
  value: { type: String, required: true }
}, { _id: false });

// 响应 Schema
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

// 菜单项 Schema
const menuSchema = new mongoose.Schema({
  text: { type: String, required: true },
  command: { type: String, required: true },
  url: String,
  order: { type: Number, required: true },
  response: responseSchema,
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
}, { _id: false });

// Bot Schema
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
    timestamps: true,
  }
);

// 添加分页插件
botSchema.plugin(mongoosePaginate);

// 数据迁移中间件
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

// 索引优化
botSchema.index({ userId: 1 });
botSchema.index({ 'menus.command': 1 });

// 创建模型
const BotModel = mongoose.model<IBotDocument, IBotModel>('Bot', botSchema);

export default BotModel; 