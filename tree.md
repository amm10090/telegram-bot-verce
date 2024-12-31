# TGBot-Vercel 项目结构

```
.
|-- .vscode/                          # VSCode 编辑器配置目录
|   `-- settings.json                 # VSCode 项目设置，包含编辑器配置和代码格式化规则
|
|-- apps/                            # 应用程序目录，包含所有应用
|   `-- web/                         # Web 应用主目录
|       |-- app/                     # Next.js App Router 目录
|       |   |-- api/                 # API 路由目录
|       |   |   |-- auth/            # 认证相关 API
|       |   |   |   |-- login/       # 登录接口，处理用户登录请求
|       |   |   |   |-- logout/      # 登出接口，处理用户登出请求
|       |   |   |   `-- refresh/     # 刷新令牌接口，处理 token 刷新
|       |   |   |-- bot/             # 机器人相关 API
|       |   |   |   `-- telegram/    # Telegram 机器人 API
|       |   |   |       |-- bots/    # 机器人管理接口
|       |   |   |       |   |-- [id]/     # 单个机器人操作
|       |   |   |       |   |   |-- menu/  # 菜单管理
|       |   |   |       |   |   |   |-- order/  # 菜单排序接口
|       |   |   |       |   |   |   |-- sync/   # Telegram 同步接口
|       |   |   |       |   |   |-- webhook/    # Webhook 配置接口
|       |   |   |       |   |-- search/   # 机器人搜索接口
|       |   |   |       |-- validate/     # 机器人验证接口
|       |   |   |-- shared/          # 共享功能目录
|       |   |   |   |-- middlewares/  # 中间件，如认证、错误处理等
|       |   |   |   |-- utils/        # 通用工具函数
|       |   |   |   `-- validators/   # 数据验证器
|       |   |   `-- users/           # 用户相关 API
|       |   |-- bots/                # 机器人管理页面
|       |   |-- dashboard/           # 仪表盘页面
|       |   |-- settings/            # 设置页面
|       |   |-- favicon.ico          # 网站图标
|       |   |-- layout.tsx           # 根布局组件，定义整体页面结构
|       |   |-- logo.svg             # 项目 Logo
|       |   `-- page.tsx             # 首页组件
|       |
|       |-- components/              # React 组件目录
|       |   |-- dashboard/           # 仪表盘相关组件
|       |   |   |-- activity-feed.tsx       # 活动流组件，显示最近活动
|       |   |   |-- bot-status-overview.tsx # 机器人状态概览组件
|       |   |   |-- dashboard-metrics.tsx   # 仪表盘指标组件
|       |   |   `-- message-volume-chart.tsx # 消息量统计图表
|       |   |-- features/            # 功能组件
|       |   |   |-- menu-item.tsx      # 菜单项组件，支持拖拽排序
|       |   |   |-- menu-form.tsx      # 菜单表单组件，处理菜单编辑
|       |   |   |-- menu-response.tsx  # 菜单响应配置组件
|       |   |   `-- menu-settings.tsx  # 菜单设置主组件
|       |   |-- services/            # 服务层组件
|       |   |   |-- telegram-bot-service.ts  # Telegram 机器人服务
|       |   |   `-- telegram-menu-service.ts # 菜单管理服务
|       |   |-- settings/            # 设置相关组件
|       |   |   |-- api-keys-management.tsx    # API 密钥管理组件
|       |   |   |-- bot-search.tsx             # 机器人搜索组件
|       |   |   |-- notification-preferences.tsx # 通知偏好设置
|       |   |   |-- security-settings.tsx       # 安全设置组件
|       |   |   |-- telegram-bot-form.tsx       # 机器人配置表单
|       |   |   `-- webhook-management.tsx      # Webhook 管理组件
|       |   |-- ClientLayout.tsx     # 客户端布局组件
|       |   |-- Header.tsx           # 页头组件
|       |   |-- Sidebar.tsx          # 侧边栏导航组件
|       |
|       |-- contexts/                # React Context 目录
|       |   |-- LocaleContext.tsx    # 国际化上下文，处理语言切换
|       |   `-- ThemeContext.tsx     # 主题上下文，处理主题切换
|       |
|       |-- hooks/                   # 自定义 Hooks 目录
|       |   |-- use-toast.ts         # Toast 提示 Hook
|       |   `-- useRoutePreload.ts   # 路由预加载 Hook
|       |
|       |-- lib/                     # 工具库目录
|       |   |-- auth.ts              # 认证相关工具函数
|       |   |-- db.ts                # 数据库连接和操作
|       |   |-- telegram.ts          # Telegram API 工具函数
|       |   `-- utils.ts             # 通用工具函数
|       |
|       |-- locales/                 # 国际化文件目录
|       |   |-- en-US.ts             # 英文翻译文件
|       |   `-- zh-CN.ts             # 中文翻译文件
|       |
|       |-- models/                  # 数据模型目录
|       |   `-- bot.ts               # 机器人数据模型定义
|       |
|       |-- styles/                  # 样式文件目录
|       |   `-- globals.css          # 全局样式定义
|       |
|       |-- types/                   # TypeScript 类型定义目录
|       |   |-- bot.ts               # 机器人相关类型定义
|       |   |-- global.d.ts          # 全局类型声明
|       |   `-- menu.ts              # 菜单相关类型定义
|
|-- packages/                        # 共享包目录
|   |-- database/                    # 数据库包
|   |   `-- prisma/                  # Prisma ORM 配置和模型
|   |-- eslint-config/              # 共享 ESLint 配置包
|   |-- typescript-config/          # 共享 TypeScript 配置包
|   `-- ui/                         # UI 组件库
|       |-- src/                    # 源代码目录
|       |   |-- components/         # UI 基础组件
|       |   |   |-- button.tsx      # 按钮组件
|       |   |   |-- form.tsx        # 表单组件
|       |   |   |-- input.tsx       # 输入框组件
|       |   |   `-- ...             # 其他 UI 组件
|       |   |-- hooks/              # UI 相关 Hooks
|       |   `-- styles/             # UI 组件样式
|
|-- .eslintrc.js                    # ESLint 配置文件
|-- .gitignore                      # Git 忽略文件配置
|-- .npmrc                          # npm 配置文件
|-- package.json                    # 项目依赖和脚本配置
|-- pnpm-workspace.yaml             # pnpm 工作区配置
|-- tsconfig.json                   # TypeScript 配置文件
|-- turbo.json                      # Turborepo 构建配置
`-- vercel.json                     # Vercel 部署配置
```

## 核心功能模块说明

### 1. 机器人管理
- **API 路由** (`/apps/web/app/api/bot`)
  - 完整的 CRUD 操作支持
  - 菜单管理和同步
  - Webhook 配置和管理
  - 状态监控和更新

- **组件** (`/apps/web/components/features`)
  - 菜单可视化编辑
  - 拖拽排序功能
  - 响应配置界面
  - 实时预览

### 2. 认证系统
- **API 路由** (`/apps/web/app/api/auth`)
  - 用户认证
  - 会话管理
  - 权限控制
  - 令牌刷新

### 3. 用户界面
- **组件库** (`/packages/ui`)
  - 可重用的基础组件
  - 统一的设计风格
  - 主题支持
  - 响应式设计

### 4. 数据层
- **模型定义** (`/apps/web/models`)
  - 数据结构定义
  - 验证规则
  - 关系映射
  - 类型安全

### 5. 国际化
- **翻译文件** (`/apps/web/locales`)
  - 多语言支持
  - 动态语言切换
  - 可扩展的翻译系统

### 6. 工具和服务
- **工具库** (`/apps/web/lib`)
  - API 集成
  - 数据处理
  - 辅助函数
  - 通用工具

### 7. 开发工具
- **配置文件**
  - ESLint 代码规范
  - TypeScript 类型检查
  - 构建和部署配置
  - 开发环境设置
