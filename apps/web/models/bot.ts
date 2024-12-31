import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { IBotDocument, IBotModel } from '@/types/bot';

// 删除所有已编译的模型
if (mongoose.models.Bot) {
  delete mongoose.models.Bot;
}

// 定义 Bot Schema
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
    menus: [{
      text: String,
      command: String,
      url: String,
      order: Number,
      response: {
        type: {
          type: String,
          enum: ['text', 'markdown', 'html', 'photo', 'video', 'document', 'inline_buttons', 'keyboard'],
          default: 'text'
        },
        content: String,
        buttons: {
          buttons: [[{
            text: String,
            type: {
              type: String,
              enum: ['url', 'callback']
            },
            value: String
          }]]
        },
        parseMode: {
          type: String,
          enum: ['Markdown', 'HTML']
        },
        mediaUrl: String,
        caption: String
      },
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
    }],
    lastUsed: { type: Date }
  },
  {
    timestamps: true,
  }
);

// 添加分页插件
botSchema.plugin(mongoosePaginate);

// 创建新模型
const BotModel = mongoose.model<IBotDocument, IBotModel>('Bot', botSchema);

export default BotModel; 