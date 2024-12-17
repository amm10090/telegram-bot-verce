// src/locales/zh-CN.ts
export default {
  // 现有的翻译
  "dashboard.welcome.title": "欢迎使用 Telegram Bot 管理器",
  "dashboard.welcome.description": "这是您的仪表盘。您可以在这里管理和监控您的 Telegram 机器人。",
  "dashboard.section.keyMetrics": "关键指标",
  "dashboard.section.analyticsActivity": "数据分析与活动",
  "dashboard.section.botStatus": "机器人状态",

  // 指标相关
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

  // 图表相关
  "dashboard.chart.messageVolume": "消息量趋势",
  "dashboard.chart.months.jan": "一月",
  "dashboard.chart.months.feb": "二月",
  "dashboard.chart.months.mar": "三月",
  "dashboard.chart.months.apr": "四月",
  "dashboard.chart.months.may": "五月",
  "dashboard.chart.months.jun": "六月",
  "dashboard.chart.months.jul": "七月",
  "dashboard.chart.tooltip.messages": "消息数：{value}",

  // 活动信息
  "dashboard.activity.title": "活动信息",
  "dashboard.activity.description": "实时机器人更新",
  "dashboard.activity.timeAgo.justNow": "刚刚",
  "dashboard.activity.timeAgo.minutes": "{count}分钟前",
  "dashboard.activity.timeAgo.hours": "{count}小时前",
  "dashboard.activity.event.userJoined": "用户 {name} 加入了 {botName}",
  "dashboard.activity.event.userLeft": "用户 {name} 离开了 {botName}",
  "dashboard.activity.event.messagesProcessed": "机器人 {name} 处理了 {count} 条消息",
  "dashboard.activity.event.error": "{botName} 出现错误：{errorMessage}",
  "dashboard.activity.event.newBot": "新机器人 '{name}' 已添加到系统",
  "dashboard.activity.event.milestone": "机器人 {name} 达到 {count} 用户里程碑",
  "dashboard.activity.event.systemUpdate": "系统更新完成",

  // 机器人状态
  "dashboard.botStatus.title": "机器人状态概览",
  "dashboard.botStatus.description": "当前活跃机器人的状态",
  "dashboard.botStatus.status.online": "在线",
  "dashboard.botStatus.status.offline": "离线",
  "dashboard.botStatus.metrics.users": "{count}个用户",
  "dashboard.botStatus.metrics.messages": "{count}条消息",

  // 通用
  "common.loading": "加载中...",
  "common.error": "错误",
  "common.retry": "重试",
  "common.noData": "暂无数据",
  // 导航相关
  "nav.dashboard": "仪表盘",
  "nav.bots": "机器人",
  "nav.settings": "设置",
  "nav.profile": "个人资料",

  // 应用标题
  "app.title": "TG机器人管理器",
  "app.description": "高效管理您的Telegram机器人",

  // 主题切换
  "theme.light": "浅色模式",
  "theme.dark": "深色模式",
  "theme.system": "跟随系统",

  // 用户界面
  "ui.search": "搜索...",
  "ui.notifications": "通知",
  "ui.profile": "个人资料",
  "ui.logout": "退出登录",
  "ui.settings": "设置",

  // 操作提示
  "actions.save": "保存",
  "actions.cancel": "取消",
  "actions.delete": "删除",
  "actions.edit": "编辑",
  "actions.confirm": "确认",

  // 状态消息
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
  //机器人页面
  "bots.title": "机器人管理",
  "bots.description": "在这里管理和监控您的 Telegram 机器人。",
  "bots.table.name": "名称",
  "bots.table.status": "状态",
  "bots.table.createdAt": "创建时间",
  "bots.table.actions": "操作",
  "bots.table.noResults": "未找到机器人。",
  "bots.table.selected": "已选择 {count}/{total} 个机器人",
  // 设置页面通用翻译
  'settings.title': '设置',
  'settings.description': '管理您的账户设置和偏好',
  'settings.form.title': '个人设置',

  // 设置页面选项卡标题
  'settings.tabs.profile': '个人资料',
  'settings.tabs.notifications': '通知设置',
  'settings.tabs.apiKeys': 'API密钥',
  'settings.tabs.system': '系统设置',
  'settings.tabs.security': '安全设置',

  // 个人资料设置
  'profile.username.label': '用户名',
  'profile.username.placeholder': '请输入用户名',
  'profile.username.description': '这是您的公开显示名称',

  'profile.email.label': '邮箱',
  'profile.email.placeholder': 'email@example.com',
  'profile.email.description': '我们会通过此邮箱发送重要通知',

  'profile.bio.label': '个人简介',
  'profile.bio.placeholder': '请简单介绍一下自己',
  'profile.bio.description': '您可以使用@提及其他用户和组织',

  'profile.button.update': '更新个人资料',
  'profile.success.title': '个人资料更新成功',

  // 通知设置
  'notifications.communication.title': '通信邮件',
  'notifications.communication.description': '接收账户活动相关的邮件通知',

  'notifications.marketing.title': '营销邮件',
  'notifications.marketing.description': '接收新产品、功能和更新的邮件',

  'notifications.social.title': '社交通知',
  'notifications.social.description': '接收好友请求、关注等社交活动的通知',

  'notifications.security.title': '安全邮件',
  'notifications.security.description': '接收账户安全相关的重要通知',

  'notifications.button.update': '更新通知设置',
  'notifications.success.title': '通知设置已更新',

  // API密钥管理
  'apiKeys.input.placeholder': '输入新API密钥名称',
  'apiKeys.button.add': '添加新密钥',
  'apiKeys.button.delete': '删除',

  'apiKeys.table.name': '名称',
  'apiKeys.table.key': 'API密钥',
  'apiKeys.table.createdAt': '创建时间',
  'apiKeys.table.actions': '操作',

  'apiKeys.error.title': '错误',
  'apiKeys.error.emptyName': '请输入API密钥名称',
  'apiKeys.success.title': '操作成功',
  'apiKeys.success.created': '新API密钥已创建',
  'apiKeys.success.deleted': 'API密钥已删除',

  // 系统设置
  'system.theme.label': '主题',
  'system.theme.description': '选择应用的显示主题',
  'system.theme.light': '浅色',
  'system.theme.dark': '深色',
  'system.theme.system': '跟随系统',

  'system.language.label': '语言',
  'system.language.description': '选择您偏好的语言',

  'system.autoUpdate.label': '自动更新',
  'system.autoUpdate.description': '当有新版本时自动更新应用',

  'system.betaFeatures.label': '测试功能',
  'system.betaFeatures.description': '启用测试阶段的新功能',

  'system.button.save': '保存偏好设置',
  'system.success.title': '系统设置已更新',

  // 安全设置
  'security.currentPassword.label': '当前密码',
  'security.newPassword.label': '新密码',
  'security.confirmPassword.label': '确认新密码',
  'security.password.minLength': '密码至少需要8个字符',
  'security.password.mismatch': '两次输入的密码不匹配',

  'security.twoFactor.label': '双因素认证',
  'security.twoFactor.description': '启用双因素认证以加强账户安全',

  'security.button.update': '更新安全设置',
  'security.success.title': '安全设置已更新',
  // 设置页面分区
  'settings.section.profile': '个人资料',
  'settings.section.security': '安全设置',
  'settings.section.integrations': '集成与通知',
  'settings.section.system': '系统偏好',

  // 个人资料部分补充
  'profile.success.saved': '个人资料保存成功',
  'profile.error.failed': '更新个人资料失败，请重试',
  'profile.title': '个人信息',
  'profile.description': '更新您的个人信息和偏好设置',

  // 安全设置部分补充
  'security.error.passwordMismatch': '两次输入的新密码不一致',
  'security.success.updated': '安全设置更新成功',
  'security.error.failed': '安全设置更新失败',
  'security.error.currentPassword': '当前密码不正确',

  // 通知设置部分补充
  'notifications.title': '通知设置',
  'notifications.description': '管理您接收通知的方式',
  'notifications.toggle.description': '启用或禁用不同类型的通知',
  'notifications.success.saved': '通知偏好设置保存成功',
  'notifications.error.failed': '更新通知设置失败',

  // API密钥部分补充
  'apiKeys.title': 'API密钥管理',
  'apiKeys.description': '管理用于第三方集成的API密钥',
  'apiKeys.warning.security': '请确保API密钥的安全，切勿分享给他人',
  'apiKeys.copy.success': 'API密钥已复制到剪贴板',
  'apiKeys.copy.button': '复制',
  'apiKeys.confirm.delete': '确定要删除这个API密钥吗？',

  // 系统偏好设置补充
  'preferences.theme.placeholder': '选择主题',
  'preferences.language.placeholder': '选择语言',
  'preferences.success.saved': '系统偏好设置保存成功',
  'preferences.error.failed': '更新系统偏好设置失败',
  'preferences.language.english': '英语',
  'preferences.language.chinese': '中文',
  // 页面头部
  'settings.profile.title': '个人资料',
  'settings.profile.subtitle': '管理您的账户信息和偏好设置',

  // 个人资料部分
  'settings.profile.username': '用户名',
  'settings.profile.username.placeholder': '请输入用户名',
  'settings.profile.username.description': '这是您的公开显示名称',
  'settings.profile.email': '邮箱',
  'settings.profile.email.placeholder': 'email@example.com',
  'settings.profile.email.description': '我们将通过此邮箱发送重要通知',
  'settings.profile.bio': '个人简介',
  'settings.profile.bio.placeholder': '介绍一下自己',
  'settings.profile.bio.description': '可以使用@提及其他用户和组织',
  'settings.profile.button.update': '更新个人资料',

  // 安全设置部分
  'settings.security.title': '安全设置',
  'settings.security.currentPassword': '当前密码',
  'settings.security.newPassword': '新密码',
  'settings.security.confirmPassword': '确认新密码',
  'settings.security.twoFactor': '双因素认证',
  'settings.security.twoFactor.description': '为您的账户添加额外的安全保护',
  'settings.security.button.update': '更新安全设置',

  // 集成部分
  'settings.integration.title': '集成与通知',

  // API密钥
  'settings.apiKeys.title': 'API密钥管理',
  'settings.apiKeys.newKey.placeholder': '输入新API密钥名称',
  'settings.apiKeys.button.add': '添加新密钥',
  'settings.apiKeys.table.name': '名称',
  'settings.apiKeys.table.key': 'API密钥',
  'settings.apiKeys.table.created': '创建时间',
  'settings.apiKeys.table.actions': '操作',

  // 系统偏好设置
  'settings.system.title': '系统偏好',
  'preferences.theme.label': '主题',
  'preferences.theme.description': '选择您喜欢的主题外观',
  'preferences.theme.system': '跟随系统',
  'preferences.language.label': '语言',
  'preferences.language.description': '选择您偏好的语言',
  'preferences.autoUpdate.label': '自动更新',
  'preferences.autoUpdate.description': '自动保持应用程序最新',
  'preferences.betaFeatures.label': '测试功能',
  'preferences.betaFeatures.description': '抢先体验未正式发布的新功能',
  'preferences.button.save': '保存设置',
  'settings.notifications.title': '通知设置',
  // 仪表盘板块描述
  "dashboard.section.keyMetrics.description": "关键性能指标概览",
  "dashboard.section.analyticsActivity.description": "机器人数据分析和近期活动",
  "dashboard.section.botStatus.description": "所有Telegram机器人的当前状态",

  // 仪表盘指标趋势
  "dashboard.metrics.trend.up": "较上期上升{value}%",
  "dashboard.metrics.trend.down": "较上期下降{value}%",
  "dashboard.metrics.trend.stable": "较上期无变化",

  // 仪表盘时间周期
  "dashboard.timePeriod.last30Days": "过去30天",
  "dashboard.timePeriod.last7Days": "过去7天",
  "dashboard.timePeriod.today": "今日",
  "dashboard.timePeriod.custom": "自定义范围",

  // 图表图例和标签
  "dashboard.chart.legend.messages": "消息量",
  "dashboard.chart.description": "消息量趋势统计",
  "dashboard.chart.tooltip.trend": "变化：{value}%",
  "dashboard.chart.noData": "所选时期暂无数据",

  // 活动信息流补充状态
  "dashboard.activity.empty": "暂无近期活动",
  "dashboard.activity.loading": "正在加载活动信息...",
  "dashboard.activity.error": "加载活动信息失败",
  "dashboard.activity.retry": "重新加载",

  // 机器人状态补充信息
  "dashboard.botStatus.metrics.uptime": "运行时间：{value}",
  "dashboard.botStatus.metrics.responseTime": "平均响应：{value}毫秒",
  "dashboard.botStatus.metrics.lastActive": "最后活动：{value}",
  "dashboard.botStatus.empty": "暂无可用机器人",

  // 仪表盘操作
  "dashboard.actions.refresh": "刷新数据",
  "dashboard.actions.export": "导出报告",
  "dashboard.actions.filter": "筛选数据",
  "dashboard.actions.viewDetails": "查看详情",
  "language.select.label": "Select language",  // 选择语言
  "language.changed": "{language} selected",   // 已选择{language}
  "language.current": "Current language: {language}",  // 当前语言：{language}
  "language.option.label": "Switch to {language}"  // 切换到{language}

}