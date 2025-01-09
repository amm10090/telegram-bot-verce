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
|       |   |   |       |   |   |-- command/  # 命令管理接口
|       |   |   |       |   |   |   `-- test/ # 命令测试接口
|       |   |   |       |   |   |-- menu/  # 菜单管理
|       |   |   |       |   |   |   |-- order/  # 菜单排序接口
|       |   |   |       |   |   |   |-- sync/   # Telegram 同步接口
|       |   |   |       |   |   |-- status/    # 机器人状态接口
|       |   |   |       |   |   |-- webhook/    # Webhook 配置接口
|       |   |   |       |   |-- search/   # 机器人搜索接口
|       |   |   |       |-- validate/     # 机器人验证接口
|       |   |   |       |-- webhook/      # 全局 Webhook 配置
|       |   |   |-- shared/          # 共享功能目录
|       |   |   |   |-- middlewares/  # 中间件，如认证、错误处理等
|       |   |   |   |-- utils/        # 通用工具函数
|       |   |   |   `-- validators/   # 数据验证器
|       |   |   |-- users/           # 用户相关 API
|       |   |   |   |-- profile/     # 用户资料接口
|       |   |   |   `-- settings/    # 用户设置接口
|       |   |   `-- webhook/         # 全局 Webhook 处理
|       |   |-- bots/                # 机器人管理页面
|       |   |   |-- bot-config-layout.tsx  # 机器人配置布局组件
|       |   |   `-- page.tsx         # 机器人列表页面
|       |   |-- dashboard/           # 仪表盘页面
|       |   |-- settings/            # 设置页面
|       |   |-- favicon.ico          # 网站图标
|       |   |-- index.html           # 静态 HTML 入口
|       |   |-- layout.tsx           # 根布局组件
|       |   `-- page.tsx             # 首页组件
|       |
|       |-- components/              # React 组件目录
|       |   |-- bot/                 # 机器人相关组件
|       |   |   |-- features/        # 功能组件
|       |   |   |   |-- menu-form.tsx    # 菜单编辑表单
|       |   |   |   |-- menu-item.tsx    # 菜单项组件
|       |   |   |   |-- menu-response.tsx # 菜单响应组件
|       |   |   |   `-- menu-settings.tsx # 菜单设置组件
|       |   |   `-- settings/        # 机器人设置组件
|       |   |       |-- BotAvatarUpload.tsx  # 头像上传组件
|       |   |       |-- BotBasicInfoForm.tsx # 基本信息表单
|       |   |       |-- BotSettingsDrawer.tsx # 设置抽屉组件
|       |   |       `-- BotWebhookConfig.tsx # Webhook 配置组件
|       |   |-- dashboard/           # 仪表盘组件
|       |   |-- icons/              # 图标组件
|       |   |-- services/           # 服务组件
|       |   |-- settings/           # 设置相关组件
|       |   |-- ClientLayout.tsx    # 客户端布局
|       |   |-- ClientProvider.tsx  # 客户端状态提供者
|       |   |-- ClientWrapper.tsx   # 客户端包装器
|       |   |-- Header.tsx          # 页头组件
|       |   |-- LanguageSwitcher.tsx # 语言切换器
|       |   |-- MainContent.tsx     # 主内容区域
|       |   |-- ResizeMonitor.tsx   # 尺寸监控组件
|       |   `-- Sidebar.tsx         # 侧边栏组件
|       |
|       |-- contexts/               # React Context 目录
|       |-- hooks/                  # 自定义 Hooks 目录
|       |-- lib/                    # 工具库目录
|       |-- locales/                # 国际化文件目录
|       |-- models/                 # 数据模型目录
|       |-- styles/                 # 样式文件目录
|       `-- types/                  # TypeScript 类型定义目录
|
|-- packages/                       # 共享包目录
|   |-- database/                   # 数据库包
|   |-- eslint-config/             # ESLint 配置包
|   |-- typescript-config/         # TypeScript 配置包
|   `-- ui/                        # UI 组件库
|
|-- prompts/                       # 提示词和文档目录
|   `-- add-comments.md            # 代码注释规范文档
|
|-- dev.log                        # 开发日志
|-- package.json                   # 项目配置文件
|-- pnpm-lock.yaml                # pnpm 依赖锁定文件
|-- pnpm-workspace.yaml           # pnpm 工作区配置
|-- tree.md                       # 项目结构说明文档
|-- tsconfig.json                 # TypeScript 配置
|-- turbo.json                    # Turborepo 配置
`-- vercel.json                   # Vercel 部署配置
```

## 核心功能模块说明

### 1. 机器人管理
- **API 路由** (`/apps/web/app/api/bot`)
  - 机器人 CRUD 操作
  - 菜单管理和同步
  - 命令管理和测试
  - Webhook 配置
  - 状态监控

- **组件** (`/apps/web/components/bot`)
  - 基本信息管理
  - 菜单编辑和排序
  - 响应配置
  - Webhook 设置
  - 头像上传

### 2. 认证系统
- **API 路由** (`/apps/web/app/api/auth`)
  - 用户登录/登出
  - 令牌刷新
  - 会话管理
  - 权限控制

### 3. 用户界面
- **组件库** (`/packages/ui`)
  - 基础 UI 组件
  - 表单控件
  - 对话框和抽屉
  - 通知提示
  - 数据展示组件

### 4. 数据层
- **数据库** (`/packages/database`)
  - 数据模型定义
  - 数据库操作
  - 关系映射

### 5. 国际化
- **翻译文件** (`/apps/web/locales`)
  - 中英文支持
  - 动态语言切换
  - 本地化配置

### 6. 开发工具
- **配置文件**
  - ESLint 代码规范
  - TypeScript 类型检查
  - Turborepo 构建优化
  - Vercel 部署配置

### 7. 监控和日志
- **开发日志** (`/dev.log`)
  - 开发进度记录
  - 问题追踪
  - 更新日志 