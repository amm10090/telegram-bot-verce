import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { IBotDocument, IBotModel } from '@/types/bot';

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
    lastUsed: { type: Date }
  },
  {
    timestamps: true,
  }
);

// 添加分页插件
botSchema.plugin(mongoosePaginate);

// 导出模型
const BotModel = (mongoose.models.Bot || mongoose.model<IBotDocument, IBotModel>('Bot', botSchema)) as IBotModel;
export default BotModel; 