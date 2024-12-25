import mongoose, { Document, Schema } from 'mongoose';

export interface IBot extends Document {
  name: string;
  token: string;
  username?: string;
  description?: string;
  isEnabled: boolean;
  status: 'active' | 'inactive';
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  owner: string;
  settings: {
    allowGroups: boolean;
    allowChannels: boolean;
    commandPrefix: string;
    customCommands: {
      command: string;
      description: string;
      response: string;
    }[];
  };
  metadata: {
    totalUsers: number;
    totalMessages: number;
    totalCommands: number;
  };
}

const BotSchema = new Schema<IBot>(
  {
    name: {
      type: String,
      required: [true, 'Bot名称是必需的'],
      trim: true,
      minlength: [2, 'Bot名称至少需要2个字符'],
      maxlength: [50, 'Bot名称不能超过50个字符'],
    },
    token: {
      type: String,
      required: [true, 'Bot Token是必需的'],
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, '描述不能超过500个字符'],
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    webhookUrl: {
      type: String,
      trim: true,
    },
    owner: {
      type: String,
      required: [true, '所有者ID是必需的'],
    },
    lastUsed: {
      type: Date,
    },
    settings: {
      allowGroups: {
        type: Boolean,
        default: true,
      },
      allowChannels: {
        type: Boolean,
        default: true,
      },
      commandPrefix: {
        type: String,
        default: '/',
        maxlength: [5, '命令前缀不能超过5个字符'],
      },
      customCommands: [
        {
          command: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            required: true,
            trim: true,
            default: '',
          },
          response: {
            type: String,
            required: true,
          },
        },
      ],
    },
    metadata: {
      totalUsers: {
        type: Number,
        default: 0,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
      totalCommands: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.token; // 不在JSON中返回token
        return ret;
      },
    },
  }
);

// 索引
BotSchema.index({ owner: 1 });
BotSchema.index({ isEnabled: 1 });
BotSchema.index({ status: 1 });
BotSchema.index({ createdAt: -1 });

// 虚拟字段
BotSchema.virtual('isActive').get(function (this: IBot) {
  return this.status === 'active' && this.isEnabled;
});

// 中间件
BotSchema.pre('save', async function (next) {
  if (this.isModified('token')) {
    // 这里可以添加token验证逻辑
  }
  next();
});

// 静态方法
BotSchema.statics.findByOwner = function (owner: string) {
  return this.find({ owner });
};

// 实例方法
BotSchema.methods.updateMetadata = async function (
  this: IBot,
  updates: Partial<IBot['metadata']>
) {
  Object.assign(this.metadata, updates);
  return this.save();
};

export const Bot = mongoose.model<IBot>('Bot', BotSchema);
