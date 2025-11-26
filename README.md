# TG Bot Management System

一个基于 Next.js 15 和 Turbo Monorepo 的现代化 Telegram Bot 管理平台，提供完整的 Bot 配置、监控和管理功能。

## 🚀 功能特性

### 核心功能
- **Bot 管理**: 创建、配置和管理多个 Telegram Bot
- **实时监控**: 仪表板实时显示 Bot 状态和活动数据
- **Webhook 配置**: 自动化 Webhook 设置和管理
- **自动回复**: 智能消息自动回复配置
- **访问控制**: 精细化的用户权限管理

### 技术特性
- 🎨 **现代化 UI**: 基于 NextUI 和 shadcn/ui 的精美界面
- 🌍 **国际化**: 支持中英文双语切换
- 🌙 **主题系统**: 内置深色/浅色主题切换
- 📱 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **高性能**: Turbo 构建优化，快速开发和部署
- 🔒 **类型安全**: 完整的 TypeScript 支持

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 15 (App Router)
- **UI 库**: React 18 + NextUI + shadcn/ui
- **样式**: Tailwind CSS + Framer Motion
- **状态管理**: React Query + React Hook Form
- **国际化**: react-intl
- **图标**: Lucide React

### 后端技术
- **API**: Next.js API Routes
- **数据库**: MongoDB + Mongoose
- **认证**: NextAuth.js
- **验证**: Zod 数据验证

### 开发工具
- **包管理**: PNPM + Turbo Monorepo
- **代码质量**: ESLint + Prettier + TypeScript
- **构建工具**: Turbo + SWC
- **部署**: Vercel (推荐)

## 📁 项目结构

```
tg-bot-management/
├── apps/
│   └── web/                    # 主应用
│       ├── app/                # Next.js App Router 页面
│       │   ├── api/            # API 路由
│       │   │   └── bot/        # Bot 相关 API
│       │   ├── dashboard/      # 仪表板页面
│       │   ├── bots/           # Bot 管理页面
│       │   └── settings/       # 设置页面
│       ├── components/         # 页面组件
│       │   ├── bot/           # Bot 相关组件
│       │   ├── dashboard/     # 仪表板组件
│       │   └── settings/      # 设置组件
│       ├── lib/               # 工具库
│       ├── models/            # 数据模型
│       └── styles/            # 样式文件
├── packages/
│   ├── ui/                    # 共享 UI 组件库
│   │   ├── src/
│   │   │   ├── components/    # UI 组件
│   │   │   ├── hooks/         # 自定义 hooks
│   │   │   ├── lib/           # 工具函数
│   │   │   └── styles/        # 样式变量
│   ├── eslint-config/         # ESLint 配置
│   └── typescript-config/     # TypeScript 配置
├── turbo.json                 # Turbo 配置
├── pnpm-workspace.yaml        # PNPM 工作空间配置
└── package.json               # 根包配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 20
- PNPM >= 9.12.3
- MongoDB 数据库

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd tg-bot-management

# 安装依赖
pnpm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 配置环境变量：
```env
# 数据库连接
MONGODB_URI=mongodb://localhost:27017/tg-bot-management

# NextAuth.js 配置
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Telegram Bot API
TELEGRAM_BOT_TOKEN=your-bot-token

# 其他配置
...
```

### 启动开发服务器
```bash
# 启动开发环境
pnpm dev

# 或者使用快速模式（禁用遥测）
pnpm dev:fast
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📝 开发指南

### 可用脚本

#### 根目录脚本
```bash
pnpm dev          # 启动开发环境
pnpm build        # 构建所有包
pnpm lint         # 代码检查
pnpm format       # 代码格式化
pnpm tree         # 生成项目结构树
```

#### Web 应用脚本
```bash
cd apps/web
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # ESLint 检查
pnpm clean        # 清理缓存和构建文件
```

### 添加 UI 组件

项目使用 shadcn/ui 组件库，要添加新组件：

```bash
# 在根目录执行
pnpm dlx shadcn@latest add button -c apps/web

# 或者在 web 应用目录执行
cd apps/web
pnpm dlx shadcn@latest add button
```

组件将自动添加到 `packages/ui/src/components` 目录。

### 开发新功能

1. **页面开发**: 在 `apps/web/app` 下创建新路由
2. **组件开发**: 在对应的功能目录下创建组件
3. **API 开发**: 在 `apps/web/app/api` 下创建 API 路由
4. **数据模型**: 在 `apps/web/models` 下定义 Mongoose 模型

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件和 Hooks
- API 路由使用 Next.js App Router 约定
- 样式使用 Tailwind CSS 类名

## 🏗️ 构建和部署

### 本地构建
```bash
# 构建所有包
pnpm build

# 单独构建 web 应用
cd apps/web
pnpm build
```

### 部署到 Vercel (推荐)
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署

### 手动部署
```bash
# 构建生产版本
pnpm build

# 启动生产服务器
cd apps/web
pnpm start
```

## 📊 API 文档

### Bot 管理 API

#### 获取 Bot 列表
```http
GET /api/bot/telegram
```

#### 创建新 Bot
```http
POST /api/bot/telegram
Content-Type: application/json

{
  "name": "Bot Name",
  "token": "bot_token",
  "description": "Bot Description"
}
```

#### 更新 Bot 配置
```http
PUT /api/bot/telegram/{botId}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated Description"
}
```

#### 删除 Bot
```http
DELETE /api/bot/telegram/{botId}
```

### Webhook 管理 API

#### 设置 Webhook
```http
POST /api/bot/telegram/webhook
Content-Type: application/json

{
  "botId": "bot_id",
  "url": "https://your-domain.com/api/webhook"
}
```

更多 API 详情请参考 `apps/web/app/api` 目录下的具体实现。

## 🎨 UI 组件库

项目包含完整的 UI 组件库，位于 `packages/ui`：

### 基础组件
- Button、Input、Select、Checkbox 等
- Dialog、Alert、Toast 等反馈组件
- Table、Form、Card 等布局组件

### 高级组件
- 数据图表组件 (Recharts)
- 拖拽排序组件 (@dnd-kit)
- 主题切换组件
- 国际化组件

### 使用组件
```tsx
import { Button } from "@workspace/ui/components/ui/button"
import { Card } from "@workspace/ui/components/ui/card"

export function MyComponent() {
  return (
    <Card>
      <Button variant="default">Click me</Button>
    </Card>
  )
}
```

## 🔧 配置说明

### Turbo 配置
项目使用 Turbo 进行 monorepo 管理，配置文件 `turbo.json`：
- 并行构建任务
- 智能缓存机制
- 依赖关系管理

### ESLint 配置
共享的 ESLint 配置位于 `packages/eslint-config`：
- TypeScript 支持
- React 最佳实践
- 代码风格检查

### TypeScript 配置
共享的 TypeScript 配置位于 `packages/typescript-config`：
- 严格模式
- 路径映射
- 现代语法支持

## 🧪 测试

项目配置了完整的测试环境：
```bash
# 运行测试
pnpm test

# 运行测试覆盖率
pnpm test:coverage

# 监听模式
pnpm test:watch
```

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 提交规范
- 使用语义化提交信息
- 确保代码通过所有检查
- 添加必要的测试
- 更新相关文档

## 📝 更新日志

### v0.0.1 (当前版本)
- 初始版本发布
- 基础 Bot 管理功能
- 仪表板和监控功能
- 用户设置系统
- 国际化支持

## ❓ 常见问题

### Q: 如何添加新的 Telegram Bot？
A: 在 Bot 管理页面点击"添加 Bot"，输入 Bot Token 和基本信息即可。

### Q: 如何配置 Webhook？
A: 在 Bot 设置页面中，找到 Webhook 配置选项，输入您的 Webhook URL。

### Q: 如何自定义主题？
A: 主题配置位于 `apps/web/styles/theme.ts`，您可以修改颜色和样式变量。

### Q: 如何添加新的语言支持？
A: 在 `apps/web/messages` 目录下添加新的语言文件，并在配置中注册。

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目：
- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [NextUI](https://nextui.org/) - React UI 库
- [Turbo](https://turbo.build/) - Monorepo 工具

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 [Issue](https://github.com/your-repo/issues)
- 发送邮件至 your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！