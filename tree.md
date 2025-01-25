.
├── .vscode
│   └── settings.json
├── apps
│   └── web
│       ├── app
│       │   ├── api
│       │   │   ├── auth
│       │   │   │   ├── login
│       │   │   │   ├── logout
│       │   │   │   └── refresh
│       │   │   ├── bot
│       │   │   │   └── telegram
│       │   │   │       ├── bots
│       │   │   │       │   ├── [id]
│       │   │   │       │   │   ├── command
│       │   │   │       │   │   │   └── test
│       │   │   │       │   │   │       └── route.ts
│       │   │   │       │   │   ├── menu
│       │   │   │       │   │   │   ├── order
│       │   │   │       │   │   │   │   └── route.ts
│       │   │   │       │   │   │   ├── sync
│       │   │   │       │   │   │   │   └── route.ts
│       │   │   │       │   │   │   └── route.ts
│       │   │   │       │   │   ├── name
│       │   │   │       │   │   │   └── route.ts
│       │   │   │       │   │   ├── shortDescription
│       │   │   │       │   │   │   └── route.ts
│       │   │   │       │   │   ├── status
│       │   │   │       │   │   │   └── route.ts
│       │   │   │       │   │   ├── webhook
│       │   │   │       │   │   │   └── route.ts
│       │   │   │       │   │   └── route.ts
│       │   │   │       │   ├── search
│       │   │   │       │   │   └── route.ts
│       │   │   │       │   └── route.ts
│       │   │   │       ├── validate
│       │   │   │       │   └── route.ts
│       │   │   │       ├── webhook
│       │   │   │       │   └── route.ts
│       │   │   │       └── route.ts
│       │   │   ├── shared
│       │   │   │   ├── middlewares
│       │   │   │   ├── utils
│       │   │   │   └── validators
│       │   │   ├── upload
│       │   │   ├── users
│       │   │   │   ├── profile
│       │   │   │   └── settings
│       │   │   └── webhook
│       │   │       └── route.ts
│       │   ├── bots
│       │   │   ├── bot-config-layout.tsx
│       │   │   └── page.tsx
│       │   ├── dashboard
│       │   │   └── page.tsx
│       │   ├── settings
│       │   │   └── page.tsx
│       │   ├── favicon.ico
│       │   ├── index.html
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components
│       │   ├── bot
│       │   │   ├── features
│       │   │   │   ├── menu-form.tsx
│       │   │   │   ├── menu-item.tsx
│       │   │   │   ├── menu-response.tsx
│       │   │   │   └── menu-settings.tsx
│       │   │   └── settings
│       │   │       ├── BotAvatarUpload.tsx
│       │   │       ├── BotBasicInfoForm.tsx
│       │   │       ├── BotSettingsDrawer.tsx
│       │   │       └── BotWebhookConfig.tsx
│       │   ├── dashboard
│       │   │   ├── activity-feed.tsx
│       │   │   ├── bot-status-overview.tsx
│       │   │   ├── dashboard-metrics.tsx
│       │   │   └── message-volume-chart.tsx
│       │   ├── icons
│       │   │   └── status-icons.tsx
│       │   ├── services
│       │   │   ├── telegram-bot-service.ts
│       │   │   └── telegram-menu-service.ts
│       │   ├── settings
│       │   │   ├── api-keys-management.tsx
│       │   │   ├── bot-search.tsx
│       │   │   ├── notification-preferences.tsx
│       │   │   ├── security-settings.tsx
│       │   │   ├── settings-form.tsx
│       │   │   ├── system-preferences.tsx
│       │   │   ├── telegram-bot-form.tsx
│       │   │   ├── user-profile.tsx
│       │   │   └── webhook-management.tsx
│       │   ├── ClientLayout.tsx
│       │   ├── ClientProvider.tsx
│       │   ├── ClientWrapper.tsx
│       │   ├── Header.tsx
│       │   ├── LanguageSwitcher.tsx
│       │   ├── MainContent.tsx
│       │   ├── ResizeMonitor.tsx
│       │   └── Sidebar.tsx
│       ├── contexts
│       │   ├── BotContext.tsx
│       │   ├── LocaleContext.tsx
│       │   └── ThemeContext.tsx
│       ├── hooks
│       │   ├── .gitkeep
│       │   ├── use-toast.ts
│       │   └── useRoutePreload.ts
│       ├── lib
│       │   ├── auth.ts
│       │   ├── bot-token.ts
│       │   ├── cache.ts
│       │   ├── db.ts
│       │   ├── telegram.ts
│       │   └── utils.ts
│       ├── locales
│       │   ├── en-US.ts
│       │   └── zh-CN.ts
│       ├── models
│       │   └── bot.ts
│       ├── styles
│       │   └── globals.css
│       ├── types
│       │   ├── bot.ts
│       │   ├── global.d.ts
│       │   ├── locale.ts
│       │   ├── next-auth.d.ts
│       │   ├── theme.d.ts
│       │   └── ui.ts
│       ├── .env
│       ├── .env.example
│       ├── .env.local
│       ├── .eslintrc.js
│       ├── components.json
│       ├── eslint.config.js
│       ├── next-env.d.ts
│       ├── next.config.js
│       ├── next.config.mjs
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── turbo.json
├── packages
│   ├── database
│   ├── eslint-config
│   │   ├── README.md
│   │   ├── base.js
│   │   ├── next.js
│   │   ├── package.json
│   │   └── react-internal.js
│   ├── typescript-config
│   │   ├── README.md
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   ├── package.json
│   │   └── react-library.json
│   └── ui
│       ├── src
│       │   ├── components
│       │   │   ├── accordion.tsx
│       │   │   ├── alert-dialog.tsx
│       │   │   ├── alert.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── chart.tsx
│       │   │   ├── checkbox.tsx
│       │   │   ├── collapsible.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── drawer.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   ├── form.tsx
│       │   │   ├── input.tsx
│       │   │   ├── label.tsx
│       │   │   ├── popover.tsx
│       │   │   ├── scroll-area.tsx
│       │   │   ├── select.tsx
│       │   │   ├── separator.tsx
│       │   │   ├── sheet.tsx
│       │   │   ├── switch.tsx
│       │   │   ├── table.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── textarea.tsx
│       │   │   ├── toast.tsx
│       │   │   └── toaster.tsx
│       │   ├── hooks
│       │   │   ├── .gitkeep
│       │   │   └── use-toast.ts
│       │   ├── lib
│       │   │   └── utils.ts
│       │   └── styles
│       │       └── globals.css
│       ├── components.json
│       ├── eslint.config.js
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── tsconfig.lint.json
├── prompts
│   └── add-comments.md
├── .env
├── .eslintrc.js
├── .gitignore
├── .npmrc
├── README.md
├── dev.log
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tree.md
├── tsconfig.json
├── turbo.json
└── vercel.json

64 directories, 153 files

# 项目结构说明

## 整体架构
- 采用 Monorepo 架构，使用 pnpm workspace 进行包管理
- 主要分为 apps 和 packages 两大模块
- 遵循 Next.js 13+ 的 App Router 架构
- 完整支持国际化(zh-CN.ts/en-US.ts)

## 后端技术架构

### API 路由(/apps/web/app/api/)
- `/auth/*`: 完整的认证体系
  - JWT 令牌管理
  - 会话刷新机制
  - 登出处理
  
- `/bot/telegram/*`: Telegram Bot 管理系统
  - 完整的 Bot 生命周期管理
  - Webhook 事件处理
  - 命令系统管理
  - 菜单配置
  - 状态监控

### 数据层设计
- 基于 MongoDB 的数据模型设计
- 使用 Mongoose 进行 ORM
- 实现了完整的缓存系统(cache.ts)
- 数据库连接池管理(db.ts)

### 中间件系统(/apps/web/app/api/shared/middlewares/)
- 认证中间件
- 错误处理中间件
- 请求验证中间件
- 日志记录中间件

### 监控与日志系统
- API 调用日志
- 错误追踪
- 性能监控
- Webhook 事件记录

## 前端集成
- 完整的 Bot 管理界面
- 实时数据展示
- 配置管理界面
- 系统设置

## 开发工具链
- ESLint 配置
- TypeScript 类型检查
- 代码格式化
- 开发日志记录

## 部署相关
- Vercel 部署配置(vercel.json)
- 环境变量管理(.env 系列文件)
- 构建优化配置(turbo.json)

# 目录与文件说明

## 根目录
- `.vscode/`: VS Code 编辑器配置目录
  - `settings.json`: 项目级 VS Code 设置

## apps/
主要应用程序目录

### apps/web/
Next.js 主应用

#### app/
Next.js App Router 目录结构
- `api/`: API 路由目录
  - `auth/`: 认证相关 API
    - `login/`: 登录接口
    - `logout/`: 登出接口
    - `refresh/`: 令牌刷新接口
  - `bot/telegram/`: Telegram Bot API
    - `bots/[id]/`: 单个机器人管理
      - `command/`: 命令管理接口
      - `menu/`: 菜单管理接口
      - `webhook/`: Webhook 处理接口
      - `name/`: 名称管理接口
      - `shortDescription/`: 简介管理接口
      - `status/`: 状态管理接口
  - `shared/`: 共享功能
    - `middlewares/`: 中间件
    - `utils/`: 工具函数
    - `validators/`: 数据验证器

#### components/
React 组件目录
- `bot/`: 机器人相关组件
  - `features/`: 功能组件
    - `menu-form.tsx`: 菜单表单组件
    - `menu-item.tsx`: 菜单项组件
    - `menu-response.tsx`: 菜单响应组件
    - `menu-settings.tsx`: 菜单设置组件
  - `settings/`: 设置组件
    - `BotAvatarUpload.tsx`: 头像上传组件
    - `BotBasicInfoForm.tsx`: 基本信息表单
    - `BotSettingsDrawer.tsx`: 设置抽屉组件
    - `BotWebhookConfig.tsx`: Webhook 配置组件
- `dashboard/`: 仪表盘组件
  - `activity-feed.tsx`: 活动流组件
  - `bot-status-overview.tsx`: 机器人状态概览
  - `dashboard-metrics.tsx`: 仪表盘指标
  - `message-volume-chart.tsx`: 消息量图表
- `settings/`: 系统设置组件
- `ClientLayout.tsx`: 客户端布局组件
- `Header.tsx`: 页头组件
- `Sidebar.tsx`: 侧边栏组件

#### contexts/
React Context 目录
- `BotContext.tsx`: 机器人上下文
- `LocaleContext.tsx`: 国际化上下文
- `ThemeContext.tsx`: 主题上下文

#### hooks/
自定义 React Hooks
- `use-toast.ts`: Toast 提示 Hook
- `useRoutePreload.ts`: 路由预加载 Hook

#### lib/
核心库文件
- `auth.ts`: 认证相关功能
- `bot-token.ts`: 机器人令牌管理
- `cache.ts`: 缓存系统
- `db.ts`: 数据库连接管理
- `telegram.ts`: Telegram API 封装
- `utils.ts`: 工具函数

#### locales/
国际化文件
- `en-US.ts`: 英文翻译
- `zh-CN.ts`: 中文翻译

#### models/
数据模型
- `bot.ts`: 机器人模型定义

#### types/
TypeScript 类型定义
- `bot.ts`: 机器人相关类型
- `global.d.ts`: 全局类型声明
- `locale.ts`: 国际化类型
- `next-auth.d.ts`: 认证类型
- `theme.d.ts`: 主题类型
- `ui.ts`: UI 组件类型

## packages/
共享包目录

### packages/database/
数据库相关包

### packages/ui/
UI 组件库
- `components/`: UI 基础组件
- `hooks/`: UI 相关 Hooks
- `lib/`: UI 工具库
- `styles/`: 样式文件

### packages/eslint-config/
ESLint 配置包
- `base.js`: 基础配置
- `next.js`: Next.js 配置
- `react-internal.js`: React 内部配置

### packages/typescript-config/
TypeScript 配置包
- `base.json`: 基础配置
- `nextjs.json`: Next.js 配置
- `react-library.json`: React 库配置

## 配置文件
- `.env`: 环境变量配置
- `.eslintrc.js`: ESLint 配置
- `.gitignore`: Git 忽略配置
- `.npmrc`: NPM 配置
- `package.json`: 项目配置
- `pnpm-workspace.yaml`: PNPM 工作区配置
- `tsconfig.json`: TypeScript 配置
- `turbo.json`: Turbo 构建配置
- `vercel.json`: Vercel 部署配置
