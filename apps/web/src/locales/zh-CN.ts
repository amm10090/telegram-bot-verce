// src/locales/zh-CN.ts

export default {
  // 仪表盘欢迎语相关
  "dashboard.welcome.title": "欢迎使用 Telegram Bot 管理器",
  "dashboard.welcome.description": "这是您的仪表盘。您可以在这里管理和监控您的 Telegram 机器人。",

  // 仪表盘各个区块标题
  "dashboard.section.keyMetrics": "关键指标",
  "dashboard.section.analyticsActivity": "数据分析与活动",
  "dashboard.section.botStatus": "机器人状态",
  "dashboard.title": "仪表盘",

  // 导航栏相关翻译
  "nav.toggle": "切换导航菜单",
  "nav.dashboard": "仪表盘",
  "nav.bots": "机器人管理",
  "nav.settings": "设置",

  // 搜索框相关
  "search.placeholder": "搜索...",

  // 语言切换功能相关
  "language.select.label": "选择语言",
  "language.option.label": "{language}", // 变量: language - 语言名称
  "language.current": "当前语言：{language}", // 变量: language - 当前选择的语言
  "language.changed": "已切换语言至{language}", // 变量: language - 新选择的语言

  // 主题切换功能相关
  "theme.light": "切换至亮色主题",
  "theme.dark": "切换至暗色主题",
  "theme.system": "跟随系统主题",

  // 应用名称相关
  "app.title": "TG机器人管理器",

  // 顶部导航栏 - 通知和用户菜单
  "notifications": "通知", // Header组件使用的通知文本
  "notifications.toggle": "通知中心", // 通知下拉菜单开关
  "profile": "个人信息", // Header组件使用的个人信息文本
  "profile.open": "个人信息", // 个人信息下拉菜单开关

  // 仪表盘 - 关键指标
  "dashboard.metrics.totalUsers": "总用户数",
  "dashboard.metrics.messages": "消息数",
  "dashboard.metrics.activeBots": "活跃机器人",
  "dashboard.metrics.errorRate": "错误率",
  "dashboard.metrics.users.description": "过去30天的活跃用户",
  "dashboard.metrics.messages.description": "过去24小时处理的消息",
  "dashboard.metrics.totalUsers.description": "过去30天的总用户数",
  "dashboard.metrics.activeBots.description": "过去30天活跃的机器人",
  "dashboard.metrics.errorRate.description": "过去30天的错误率",
  "dashboard.metrics.bots.description": "当前在线且响应的机器人",
  "dashboard.metrics.error.description": "请求失败百分比",

  // 仪表盘 - 图表相关
  "dashboard.chart.messageVolume": "消息量趋势",
  "dashboard.chart.months.jan": "一月",
  "dashboard.chart.months.feb": "二月",
  "dashboard.chart.months.mar": "三月",
  "dashboard.chart.months.apr": "四月",
  "dashboard.chart.months.may": "五月",
  "dashboard.chart.months.jun": "六月",
  "dashboard.chart.months.jul": "七月",
  "dashboard.chart.tooltip.messages": "消息数：{value}", // 变量: value - 消息数量

  // 仪表盘 - 活动信息流
  "dashboard.activity.title": "活动信息",
  "dashboard.activity.description": "实时机器人更新",
  "dashboard.activity.timeAgo.justNow": "刚刚",
  "dashboard.activity.timeAgo.minutes": "{count}分钟前", // 变量: count - 分钟数
  "dashboard.activity.timeAgo.hours": "{count}小时前", // 变量: count - 小时数
  "dashboard.activity.event.userJoined": "用户 {name} 加入了 {botName}", // 变量: name - 用户名, botName - 机器人名称
  "dashboard.activity.event.userLeft": "用户 {name} 离开了 {botName}", // 变量: name - 用户名, botName - 机器人名称
  "dashboard.activity.event.messagesProcessed": "机器人 {name} 处理了 {count} 条消息", // 变量: name - 机器人名称, count - 消息数
  "dashboard.activity.event.error": "{botName} 出现错误：{errorMessage}", // 变量: botName - 机器人名称, errorMessage - 错误信息
  "dashboard.activity.event.newBot": "新机器人 '{name}' 已添加到系统", // 变量: name - 机器人名称
  "dashboard.activity.event.milestone": "机器人 {name} 达到 {count} 用户里程碑", // 变量: name - 机器人名称, count - 用户数
  "dashboard.activity.event.systemUpdate": "系统更新完成",

  // 机器人状态相关
  "dashboard.botStatus.title": "机器人状态概览",
  "dashboard.botStatus.description": "当前活跃机器人的状态",
  "dashboard.botStatus.status.online": "在线",
  "dashboard.botStatus.status.offline": "离线",
  "dashboard.botStatus.metrics.users": "{count}个用户", // 变量: count - 用户数
  "dashboard.botStatus.metrics.messages": "{count}条消息", // 变量: count - 消息数
  "dashboard.botStatus.status.active": "在线",
  "dashboard.botStatus.status.inactive": "离线",
  "dashboard.botStatus.status.error": "机器人出错",
  "dashboard.botStatus.metrics.users.description": "过去30天的活跃用户",
  "dashboard.botStatus.metrics.messages.description": "过去24小时处理的消息",
  "dashboard.botStatus.metrics.uptime.description": "机器人运行时间",
  "dashboard.botStatus.metrics.errorRate.description": "过去30天的错误率",
  "dashboard.botStatus.metrics.activeUsers.description": "机器人活跃用户数",
  "dashboard.botStatus.metrics.activeChats.description": "机器人活跃聊天数",
  "dashboard.botStatus.metrics.activeCommands.description": "机器人活跃命令数",

  // 通用功能性文本
  "common.loading": "加载中...",
  "common.error": "错误",
  "common.retry": "重试",
  "common.noData": "暂无数据",
  "common.search": "搜索",
  "common.openMenu": "菜单",
  "common.actions": "操作",
  "common.edit": "编辑",
  "common.delete": "删除",
  "common.selectAll": "全选",
  "common.selectRow": "选择行",
  "common.cancel": "取消",

  // 分页相关
  "common.pageInfo": "第 {current} 页，共 {total} 页", // 变量: current - 当前页码, total - 总页数
  "common.pageNumber": "第 {number} 页", // 变量: number - 页码
  "common.previousPage": "上一页",
  "common.nextPage": "下一页",

  // 用户界面元素
  "ui.search": "搜索...",
  "ui.notifications": "通知",
  "ui.profile": "个人资料",
  "ui.logout": "退出登录",
  "ui.settings": "设置",

  // 操作按钮文本
  "actions.save": "保存",
  "actions.cancel": "取消",
  "actions.delete": "删除",
  "actions.edit": "编辑",
  "actions.confirm": "确认",

  // 状态提示信息
  "status.loading": "加载中...",
  "status.error": "发生错误",
  "status.success": "操作成功",
  "status.empty": "暂无数据",

  // 确认对话框
  "dialog.confirm.title": "确认",
  "dialog.confirm.message": "确定要执行此操作吗？",
  "dialog.confirm.ok": "确定",
  "dialog.confirm.cancel": "取消",

  // 表格相关
  "table.rowsPerPage": "每页行数：",
  "table.of": "共",
  "table.nextPage": "下一页",
  "table.previousPage": "上一页",

  // 机器人管理页面
  "bots.title": "机器人管理",
  "bots.description": "在这里管理和监控您的 Telegram 机器人。",
  "bots.table.name": "名称",
  "bots.table.status": "状态",
  "bots.table.createdAt": "创建时间",
  "bots.table.actions": "操作",
  "bots.table.noResults": "未找到机器人。",
  "bots.table.selected": "已选择 {count}/{total} 个机器人", // 变量: count - 选中数量, total - 总数
  "bots.table.copyToken": "复制Token",
  "bots.table.addNew": "添加机器人",
  "bots.table.edit": "编辑",
  "bots.table.selectAll": "全选",
  "bots.table.selectRow": "选择行",
  "bots.table.openMenu": "菜单",
  "bots.table.delete": "删除",
  "bots.table.deleteConfirm": "确定要删除选中的 {count} 个机器人吗？", // 变量: count - 选中数量
  "bots.table.deleteSuccess": "已删除 {count} 个机器人", // 变量: count - 删除数量
  "bots.table.deleteError": "删除 {count} 个机器人失败", // 变量: count - 失败数量
  "bots.table.viewDetails": "查看详情",

  // 设置页面
  "settings.title": "设置",
  "settings.description": "管理您的账户设置和偏好",
  "settings.form.title": "个人设置",
  "settings.profile.title": "个人资料",
  "settings.profile.subtitle": "管理您的账户信息和偏好设置",

  // 设置页面 - 选项卡
  "settings.tabs.profile": "个人资料",
  "settings.tabs.notifications": "通知设置",
  "settings.tabs.system": "系统设置",
  "settings.security.title": "安全设置",

  // 设置页面 - 个人资料
  "profile.username.label": "用户名",
  "profile.username.placeholder": "请输入用户名",
  "profile.username.description": "这是您的公开显示名称",
  "profile.email.label": "邮箱",
  "profile.email.placeholder": "email@example.com",
  "profile.email.description": "我们会通过此邮箱发送重要通知",
  "profile.bio.label": "个人简介",
  "profile.bio.placeholder": "请简单介绍一下自己",
  "profile.bio.description": "您可以使用@提及其他用户和组织",
  "profile.button.update": "更新个人资料",
  "profile.success.title": "个人资料更新成功",
  "profile.success.saved": "个人资料保存成功",
  "profile.error.failed": "更新个人资料失败，请重试",
  "profile.title": "个人信息",
  "profile.description": "更新您的个人信息和偏好设置",

  // 设置页面 - 通知设置
  "notifications.communication.title": "通信邮件",
  "notifications.communication.description": "接收账户活动相关的邮件通知",
  "notifications.marketing.title": "营销邮件",
  "notifications.marketing.description": "接收新产品、功能和更新的邮件",
  "notifications.social.title": "社交通知",
  "notifications.social.description": "接收好友请求、关注等社交活动的通知",
  "notifications.security.title": "安全邮件",
  "notifications.security.description": "接收账户安全相关的重要通知",
  "notifications.button.update": "更新通知设置",
  "settings.system.title": "通知设置已更新",
  "notifications.title": "通知设置",
  "notifications.description": "管理您接收通知的方式",
  "notifications.toggle.description": "启用或禁用不同类型的通知",
  "notifications.success.title": "通知偏好设置保存成功",
  "notifications.error.failed": "更新通知设置失败",
  'notifications.success.description': '通知设置已更新',

  // 设置页面 - API密钥管理
  "apiKeys.types.other": "其他",
  "apiKeys.input.placeholder": "输入新API密钥名称",
  "apiKeys.actions.add": "添加新密钥",
  "apiKeys.actions.delete": "删除",
  "apiKeys.deleteSuccess": "API密钥已删除",
  "apiKeys.deleteError": "删除API密钥失败",
  "apiKeys.table.type": "类型",
  "apiKeys.table.name": "名称",
  "apiKeys.table.key": "API密钥",
  "apiKeys.table.createdAt": "创建时间",
  "apiKeys.table.actions": "操作",
  "apiKeys.copied": "已复制到剪贴板",
  "apiKeys.error.title": "错误",
  "apiKeys.error.emptyName": "请输入API密钥名称",
  "apiKeys.success.title": "操作成功",
  "apiKeys.success.created": "新API密钥已创建",
  "apiKeys.success.deleted": "API密钥已删除",
  "apiKeys.actions.edit": "编辑",
  "apiKeys.actions.copy": "复制",
  "apiKeys.dialog.editTitle": "编辑API密钥",
  "apiKeys.dialog.editDescription": "编辑API密钥名称",
  // 设置页面 - API密钥管理（续）
  "apiKeys.dialog.editName": "名称",
  "apiKeys.dialog.editKey": "API密钥",
  "apiKeys.dialog.addTitle": "添加API密钥",
  "apiKeys.dialog.addDescription": "添加新的API密钥",
  "apiKeys.dialog.addName": "名称",
  "apiKeys.dialog.addType": "类型",
  "apiKeys.dialog.addKey": "API密钥",
  "apiKeys.table.lastUsed": "上次使用时间",
  "apiKeys.status.inactive": "未激活",
  "apiKeys.dialog.deleteTitle": "删除API密钥",
  "apiKeys.dialog.deleteDescription": "您确定要删除这个API密钥吗？此操作无法撤销。",
  "apiKeys.toast.copySuccess": "已复制到剪贴板",
  "apiKeys.toast.deleteSuccess": "已成功删除API密钥",
  "settings.apiKeys.title": "API密钥管理",
  "apiKeys.description": "管理用于第三方集成的API密钥",
  "apiKeys.warning.security": "请确保API密钥的安全，切勿分享给他人",
  "apiKeys.copy.success": "API密钥已复制到剪贴板",
  "apiKeys.copy.button": "复制",
  "apiKeys.confirm.delete": "确定要删除这个API密钥吗？",
  'apiKeys.title': "API密钥",
  'apiKeys.table.empty': '暂无API密钥',
  'apiKeys.error.fetch': '获取API密钥失败',
  // 设置页面 - 系统设置
  "system.theme.label": "主题",
  "system.theme.description": "选择应用的显示主题",
  "system.theme.light": "浅色",
  "system.theme.dark": "深色",
  "system.theme.system": "跟随系统",
  "system.language.label": "语言",
  "system.language.description": "选择您偏好的语言",
  "system.autoUpdate.label": "自动更新",
  "system.autoUpdate.description": "当有新版本时自动更新应用",
  "system.betaFeatures.label": "测试功能",
  "system.betaFeatures.description": "启用测试阶段的新功能",
  "system.button.save": "保存偏好设置",
  "system.success.title": "系统设置已更新",

  // 设置页面 - 安全设置
  "security.currentPassword.label": "当前密码",
  "security.newPassword.label": "新密码",
  "security.confirmPassword.label": "确认新密码",
  "security.password.minLength": "密码至少需要8个字符",
  "security.password.mismatch": "两次输入的密码不匹配",
  "security.twoFactor.label": "双因素认证",
  "security.twoFactor.description": "启用双因素认证以加强账户安全",
  "security.button.update": "更新安全设置",
  "security.success.title": "安全设置已更新",
  "security.error.passwordMismatch": "两次输入的新密码不一致",
  "security.success.updated": "安全设置更新成功",
  "security.error.failed": "安全设置更新失败",
  "security.error.currentPassword": "当前密码不正确",

  // 设置页面 - 偏好设置
  "preferences.theme.placeholder": "选择主题",
  "preferences.language.placeholder": "选择语言",
  "preferences.success.saved": "系统偏好设置保存成功",
  "preferences.error.failed": "更新系统偏好设置失败",
  "preferences.language.english": "英语",
  "preferences.language.chinese": "中文",
  "preferences.theme.label": "主题",
  "preferences.theme.description": "选择您喜欢的主题外观",
  "preferences.theme.system": "跟随系统",
  "preferences.language.label": "语言",
  "preferences.language.description": "选择您偏好的语言",
  "preferences.autoUpdate.label": "自动更新",
  "preferences.autoUpdate.description": "自动保持应用程序最新",
  "preferences.betaFeatures.label": "测试功能",
  "preferences.betaFeatures.description": "抢先体验未正式发布的新功能",
  "preferences.button.save": "保存设置",
  "preferences.theme.light": "浅色",
  "preferences.theme.dark": "深色",

  // 设置页面 - 分区标题
  "settings.section.profile": "个人资料",
  "settings.section.security": "安全设置",
  "settings.section.integrations": "集成与通知",
  "settings.section.system": "系统偏好",
  "settings.notifications.title": "通知设置"
}