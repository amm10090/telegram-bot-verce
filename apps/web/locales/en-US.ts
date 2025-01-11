// src/locales/en-US.ts
export default {
  // 现有的翻译
  "dashboard.welcome.title": "Welcome to Telegram Bot Manager",
  "dashboard.welcome.description": "This is your dashboard. You can manage and monitor your Telegram bots here.",
  "dashboard.section.keyMetrics": "Key Metrics",
  "dashboard.section.analyticsActivity": "Analytics & Activity",
  "dashboard.section.botStatus": "Bot Status",

  // 指标相关
  "dashboard.metrics.totalUsers": "Total Users",
  "dashboard.metrics.messages": "Messages",
  "dashboard.metrics.activeBots": "Active Bots",
  "dashboard.metrics.errorRate": "Error Rate",
  "dashboard.metrics.users.description": "Active users in the last 30 days",
  "dashboard.metrics.messages.description": "Messages processed in the last 24 hours",
  "dashboard.metrics.totalUsers.description": "Total users registered in the system",
  "dashboard.metrics.activeBots.description": "Number of active bots in the system",
  "dashboard.metrics.errorRate.description": "Percentage of failed requests in the last 24 hours",


  "dashboard.metrics.bots.description": "Bots currently online and responding",
  "dashboard.metrics.error.description": "Percentage of failed requests",

  // 图表相关
  "dashboard.chart.messageVolume": "Message Volume Over Time",
  "dashboard.chart.months.jan": "January",
  "dashboard.chart.months.feb": "February",
  "dashboard.chart.months.mar": "March",
  "dashboard.chart.months.apr": "April",
  "dashboard.chart.months.may": "May",
  "dashboard.chart.months.jun": "June",
  "dashboard.chart.months.jul": "July",
  "dashboard.chart.tooltip.messages": "Messages: {value}",

  // 活动信息
  "dashboard.activity.title": "Activity Feed",
  "dashboard.activity.description": "Real-time updates from your bots",
  "dashboard.activity.timeAgo.justNow": "just now",
  "dashboard.activity.timeAgo.minutes": "{count} {count, plural, one {minute} other {minutes}} ago",
  "dashboard.activity.timeAgo.hours": "{count} {count, plural, one {hour} other {hours}} ago",
  "dashboard.activity.event.userJoined": "User {name} joined {botName}",
  "dashboard.activity.event.userLeft": "User {name} left {botName}",
  "dashboard.activity.event.messagesProcessed": "Bot {name} processed {count} messages",
  "dashboard.activity.event.error": "Error in {botName}: {errorMessage}",
  "dashboard.activity.event.newBot": "New bot '{name}' added to system",
  "dashboard.activity.event.milestone": "Bot {name} reached {count} users milestone",
  "dashboard.activity.event.systemUpdate": "System update completed",

  // 机器人状态
  "dashboard.botStatus.title": "Bot Status Overview",
  "dashboard.botStatus.description": "Current status of your active bots",
  "dashboard.botStatus.status.online": "Online",
  "dashboard.botStatus.status.offline": "Offline",
  "dashboard.botStatus.metrics.users": "{count} {count, plural, one {user} other {users}}",
  "dashboard.botStatus.metrics.messages": "{count} {count, plural, one {message} other {messages}}",

  // 通用
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.retry": "Retry",
  "common.noData": "No data available",
  // 导航相关
  "nav.dashboard": "Dashboard",
  "nav.bots": "Bots",
  "nav.settings": "Settings",
  "nav.profile": "Profile",
  "nav.mainNavigation": "Main Navigation",
  "nav.open": "Open",
  "nav.close": "Close",
  // 应用标题
  "app.title": "TG Bot Manager",
  "app.description": "Manage your Telegram bots efficiently",

  // 主题切换
  "theme.light": "Light Mode",
  "theme.dark": "Dark Mode",
  "theme.system": "System Theme",

  // 用户界面
  "ui.search": "Search...",
  "ui.notifications": "Notifications",
  "ui.profile": "Profile",
  "ui.logout": "Logout",
  "ui.settings": "Settings",

  // 操作提示
  "actions.save": "Save",
  "actions.cancel": "Cancel",
  "actions.delete": "Delete",
  "actions.edit": "Edit",
  "actions.confirm": "Confirm",

  // 状态消息
  "status.loading": "Loading...",
  "status.error": "Error occurred",
  "status.success": "Operation successful",
  "status.empty": "No data available",

  // 确认对话框
  "dialog.confirm.title": "Confirmation",
  "dialog.confirm.message": "Are you sure you want to proceed?",
  "dialog.confirm.ok": "OK",
  "dialog.confirm.cancel": "Cancel",

  // 表格相关
  "table.rowsPerPage": "Rows per page:",
  "table.of": "of",
  "table.nextPage": "Next page",
  "table.previousPage": "Previous page",
  //机器人页面
  "bots.title": "Bot Management",
  "bots.description": "Manage and monitor your Telegram bots here.",
  "bots.table.name": "Name",
  "bots.table.status": "Status",
  "bots.table.createdAt": "Created At",
  "bots.table.actions": "Actions",
  "bots.table.noResults": "No bots found.",
  "bots.table.selected": "{count} of {total} bot(s) selected",
  // General Settings Page
  'settings.title': 'Settings',
  'settings.description': 'Manage your account settings and preferences',
  'settings.form.title': 'Personal Settings',

  // Settings Tabs
  'settings.tabs.profile': 'Profile',
  'settings.tabs.notifications': 'Notifications',
  'settings.tabs.apiKeys': 'API Keys',
  'settings.tabs.system': 'System',
  'settings.tabs.security': 'Security',

  // Profile Settings
  'profile.username.label': 'Username',
  'profile.username.placeholder': 'Enter username',
  'profile.username.description': 'This is your public display name',

  'profile.email.label': 'Email',
  'profile.email.placeholder': 'email@example.com',
  'profile.email.description': "We'll use this email for important notifications",

  'profile.bio.label': 'Bio',
  'profile.bio.placeholder': 'Tell us a little bit about yourself',
  'profile.bio.description': 'You can @mention other users and organizations',

  'profile.button.update': 'Update profile',
  'profile.success.title': 'Profile updated successfully',

  // Notification Settings
  'notifications.communication.title': 'Communication Emails',
  'notifications.communication.description': 'Receive emails about your account activity',

  'notifications.marketing.title': 'Marketing Emails',
  'notifications.marketing.description': 'Receive emails about new products and features',

  'notifications.social.title': 'Social Notifications',
  'notifications.social.description': 'Receive notifications about friend requests and follows',

  'notifications.security.title': 'Security Emails',
  'notifications.security.description': 'Receive emails about your account security',

  'notifications.button.update': 'Update notifications',
  'notifications.success.title': 'Notification settings updated',

  // API Keys Management
  'apiKeys.input.placeholder': 'Enter new API key name',
  'apiKeys.button.add': 'Add New Key',
  'apiKeys.button.delete': 'Delete',

  'apiKeys.table.name': 'Name',
  'apiKeys.table.key': 'API Key',
  'apiKeys.table.createdAt': 'Created At',
  'apiKeys.table.actions': 'Actions',

  'apiKeys.error.title': 'Error',
  'apiKeys.error.emptyName': 'Please enter an API key name',
  'apiKeys.success.title': 'Success',
  'apiKeys.success.created': 'New API key has been created',
  'apiKeys.success.deleted': 'API key has been deleted',

  // System Settings
  'system.theme.label': 'Theme',
  'system.theme.description': 'Select the application theme',
  'system.theme.light': 'Light',
  'system.theme.dark': 'Dark',
  'system.theme.system': 'System',

  'system.language.label': 'Language',
  'system.language.description': 'Select your preferred language',

  'system.autoUpdate.label': 'Automatic Updates',
  'system.autoUpdate.description': 'Update application automatically when new versions are available',

  'system.betaFeatures.label': 'Beta Features',
  'system.betaFeatures.description': 'Enable beta features for testing',

  'system.button.save': 'Save preferences',
  'system.success.title': 'System settings updated',

  // Security Settings
  'security.currentPassword.label': 'Current Password',
  'security.newPassword.label': 'New Password',
  'security.confirmPassword.label': 'Confirm New Password',
  'security.password.minLength': 'Password must be at least 8 characters',
  'security.password.mismatch': 'Passwords do not match',

  'security.twoFactor.label': 'Two-Factor Authentication',
  'security.twoFactor.description': 'Enable two-factor authentication for enhanced security',

  'security.button.update': 'Update security settings',
  'security.success.title': 'Security settings updated',
  // Settings Sections
  'settings.section.profile': 'User Profile',
  'settings.section.security': 'Security Settings',
  'settings.section.integrations': 'Integrations & Notifications',
  'settings.section.system': 'System Preferences',

  // Profile Section Additional Items
  'profile.success.saved': 'Your profile has been saved successfully',
  'profile.error.failed': 'Failed to update profile. Please try again',
  'profile.title': 'Personal Information',
  'profile.description': 'Update your personal details and preferences',

  // Security Section Additional Items
  'security.error.passwordMismatch': 'The new passwords you entered do not match',
  'security.success.updated': 'Security settings have been updated successfully',
  'security.error.failed': 'Failed to update security settings',
  'security.error.currentPassword': 'Current password is incorrect',

  // Notifications Section Additional Items
  'notifications.title': 'Notification Settings',
  'notifications.description': 'Manage how you receive notifications',
  'notifications.toggle.description': 'Enable or disable different types of notifications',
  'notifications.success.saved': 'Notification preferences saved successfully',
  'notifications.error.failed': 'Failed to update notification settings',

  // API Keys Section Additional Items
  'apiKeys.title': 'API Key Management',
  'apiKeys.description': 'Manage your API keys for third-party integrations',
  'apiKeys.warning.security': 'Keep your API keys secure and never share them',
  'apiKeys.copy.success': 'API key copied to clipboard',
  'apiKeys.copy.button': 'Copy',
  'apiKeys.confirm.delete': 'Are you sure you want to delete this API key?',

  // System Preferences Additional Items
  'preferences.theme.placeholder': 'Select theme',
  'preferences.language.placeholder': 'Select language',
  'preferences.success.saved': 'System preferences saved successfully',
  'preferences.error.failed': 'Failed to update system preferences',
  'preferences.language.english': 'English',
  'preferences.language.chinese': 'Chinese',// Page Header
  'settings.profile.title': 'Personal Information',
  'settings.profile.subtitle': 'Manage your account information and preferences',

  // Profile Section
  'settings.profile.username': 'Username',
  'settings.profile.username.placeholder': 'Enter your username',
  'settings.profile.username.description': 'This is your public display name',
  'settings.profile.email': 'Email',
  'settings.profile.email.placeholder': 'email@example.com',
  'settings.profile.email.description': "We'll use this email for important notifications",
  'settings.profile.bio': 'Bio',
  'settings.profile.bio.placeholder': 'Tell us about yourself',
  'settings.profile.bio.description': 'You can @mention other users and organizations',
  'settings.profile.button.update': 'Update Profile',

  // Security Section
  'settings.security.title': 'Security Settings',
  'settings.security.currentPassword': 'Current Password',
  'settings.security.newPassword': 'New Password',
  'settings.security.confirmPassword': 'Confirm New Password',
  'settings.security.twoFactor': 'Two-Factor Authentication',
  'settings.security.twoFactor.description': 'Add an extra layer of security to your account',
  'settings.security.button.update': 'Update Security Settings',

  // Integration Section
  'settings.integration.title': 'Integrations & Notifications',

  // API Keys
  'settings.apiKeys.title': 'API Key Management',
  'settings.apiKeys.newKey.placeholder': 'Enter new API key name',
  'settings.apiKeys.button.add': 'Add New Key',
  'settings.apiKeys.table.name': 'Name',
  'settings.apiKeys.table.key': 'API Key',
  'settings.apiKeys.table.created': 'Created At',
  'settings.apiKeys.table.actions': 'Actions',

  // System Preferences
  'settings.system.title': 'System Preferences',
  'preferences.theme.label': 'Theme',
  'preferences.theme.description': 'Choose your preferred theme',
  'preferences.language.label': 'Language',
  'preferences.language.description': 'Select your preferred language',
  'preferences.autoUpdate.label': 'Automatic Updates',
  'preferences.autoUpdate.description': 'Keep the application up to date automatically',
  'preferences.betaFeatures.label': 'Beta Features',
  'preferences.betaFeatures.description': 'Try out new features before they\'re released',
  'preferences.button.save': 'Save Preferences',
  'settings.notifications.title': 'Notification Settings',

  // Dashboard Section Descriptions
  "dashboard.section.keyMetrics.description": "Overview of your key performance indicators",
  "dashboard.section.analyticsActivity.description": "Analysis and recent activities from your bots",
  "dashboard.section.botStatus.description": "Current status of all your Telegram bots",

  // Dashboard Metrics Trends
  "dashboard.metrics.trend.up": "Up {value}% from last period",
  "dashboard.metrics.trend.down": "Down {value}% from last period",
  "dashboard.metrics.trend.stable": "No change from last period",

  // Dashboard Time Periods
  "dashboard.timePeriod.last30Days": "Last 30 Days",
  "dashboard.timePeriod.last7Days": "Last 7 Days",
  "dashboard.timePeriod.today": "Today",
  "dashboard.timePeriod.custom": "Custom Range",

  // Chart Legends and Labels
  "dashboard.chart.legend.messages": "Message Volume",
  "dashboard.chart.description": "Message volume trends over time",
  "dashboard.chart.tooltip.trend": "Change: {value}%",
  "dashboard.chart.noData": "No data available for selected period",

  // Activity Feed Additional States
  "dashboard.activity.empty": "No recent activity",
  "dashboard.activity.loading": "Loading activities...",
  "dashboard.activity.error": "Failed to load activities",
  "dashboard.activity.retry": "Retry loading",

  // Bot Status Additional Information
  "dashboard.botStatus.metrics.uptime": "Uptime: {value}",
  "dashboard.botStatus.metrics.responseTime": "Avg Response: {value}ms",
  "dashboard.botStatus.metrics.lastActive": "Last Active: {value}",
  "dashboard.botStatus.empty": "No bots available",

  // Dashboard Actions
  "dashboard.actions.refresh": "Refresh Data",
  "dashboard.actions.export": "Export Report",
  "dashboard.actions.filter": "Filter Data",
  "dashboard.actions.viewDetails": "View Details",

  // 导航
  'nav.toggle': 'Toggle navigation menu',
  'dashboard.title': 'Dashboard',
  
  // 搜索
  'search.placeholder': 'Search...',
  
  // 通知和用户
  'notifications': 'Notifications',
  'profile': 'User profile',
  
  // 语言选择
  'language.select.label': 'Select language',
  'language.option.label': '{language}',
  'language.current': 'Current language: {language}',

  // 语言切换相关
  'language.changed': 'Language changed to {language}',

  // Bot Table Additional
  "bots.table.viewDetails": "View Details",
  "bots.table.selectRow": "Select Row",
  "bots.table.selectAll": "Select All",
  "bots.table.openMenu": "Open Menu",
  "bots.table.copyToken": "Copy Token",
  "bots.table.token": "Token",
  "bots.table.lastActive": "Last Active",
  "bots.table.description": "Description",
  "bots.table.menu.edit": "Edit",
  "bots.table.menu.delete": "Delete",
  "bots.table.menu.restart": "Restart",
  "bots.table.menu.stop": "Stop",
  "bots.table.menu.logs": "View Logs",
  "bots.table.menu.settings": "Settings",
  "bots.table.addNew": "Add New Bot",

  // Bot Status Additional
  "dashboard.botStatus.status.active": "Active",
  "dashboard.botStatus.status.inactive": "Inactive",
  "dashboard.botStatus.status.error": "Error",
  "dashboard.botStatus.status.starting": "Starting",
  "dashboard.botStatus.status.stopping": "Stopping",
  "dashboard.botStatus.status.restarting": "Restarting",
  "dashboard.botStatus.status.updating": "Updating",

  // API Keys Management Additional
  "apiKeys.dialog.deleteTitle": "Delete API Key",
  "apiKeys.dialog.deleteDescription": "Are you sure you want to delete this API key? This action cannot be undone.",
  "apiKeys.table.type": "Type",
  "apiKeys.table.lastUsed": "Last Used",
  "apiKeys.table.status": "Status",
  "apiKeys.table.permissions": "Permissions",
  "apiKeys.table.expiresAt": "Expires At",
  "apiKeys.table.empty": "No API keys found",
  "apiKeys.status.active": "Active",
  "apiKeys.status.expired": "Expired",
  "apiKeys.status.revoked": "Revoked",
  "apiKeys.type.read": "Read Only",
  "apiKeys.type.write": "Read & Write",
  "apiKeys.type.admin": "Admin",
  "apiKeys.permissions.read": "Read",
  "apiKeys.permissions.write": "Write",
  "apiKeys.permissions.admin": "Admin",
  "apiKeys.expiry.never": "Never",
  "apiKeys.expiry.custom": "Custom",
  "apiKeys.error.invalidData": "Invalid API key data",
  "apiKeys.error.fetchFailed": "Failed to fetch API keys",
  "apiKeys.error.createFailed": "Failed to create API key",
  "apiKeys.error.updateFailed": "Failed to update API key",
  "apiKeys.error.deleteFailed": "Failed to delete API key",
  "apiKeys.error.invalidName": "Invalid API key name",
  "apiKeys.error.invalidType": "Invalid API key type",
  "apiKeys.error.invalidPermissions": "Invalid permissions",
  "apiKeys.error.invalidExpiry": "Invalid expiry date",

  // Common Actions (if not already defined)
  "common.actions.cancel": "Cancel",
  "common.actions.delete": "Delete",
  "common.actions.save": "Save",
  "common.actions.edit": "Edit",
  "common.actions.add": "Add",
  "common.actions.remove": "Remove",
  "common.actions.create": "Create",
  "common.actions.update": "Update",
  "common.actions.close": "Close",
  "common.actions.confirm": "Confirm",
  "common.actions.back": "Back",
  "common.actions.next": "Next",
  "common.actions.search": "Search",
  "common.actions.filter": "Filter",
  "common.actions.reset": "Reset",
  "common.actions.apply": "Apply",
  "common.actions.clear": "Clear",
  "common.actions.done": "Done",
  "common.actions.view": "View",
  "common.actions.copy": "Copy",
  "common.actions.refresh": "Refresh",
  "common.actions.more": "More",
  "common.actions.less": "Less",
  "common.actions.show": "Show",
  "common.actions.hide": "Hide",
  "common.actions.enable": "Enable",
  "common.actions.disable": "Disable",

  // Common States
  "common.states.enabled": "Enabled",
  "common.states.disabled": "Disabled",
  "common.states.loading": "Loading...",
  "common.states.success": "Success",
  "common.states.error": "Error",
  "common.states.warning": "Warning",
  "common.states.info": "Info",

  // API Keys Dialog
  "apiKeys.dialog.addTitle": "Add New API Key",
  "apiKeys.dialog.addDescription": "Create a new API key for accessing the system.",
  "apiKeys.dialog.editTitle": "Edit API Key",
  "apiKeys.dialog.editDescription": "Modify the settings of your API key.",
  "apiKeys.actions.add": "Add API Key",

  // Common Pagination
  "common.pageInfo": "Page {current} of {total}",
  "common.previousPage": "Previous page",
  "common.nextPage": "Next page",
  "common.pageNumber": "Page {number}",

  // Theme Preferences
  "preferences.theme.light": "Light",
  "preferences.theme.dark": "Dark",
  "preferences.theme.system": "System",

  // Common Search
  "common.search": "Search",
  "common.searchPlaceholder": "Search...",

  // Common Actions
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.save": "Save",
  "common.edit": "Edit",
  "common.add": "Add",
  "common.remove": "Remove",
  "common.create": "Create",
  "common.update": "Update",
  "common.close": "Close",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.next": "Next",
  "common.filter": "Filter",
  "common.reset": "Reset",
  "common.apply": "Apply",
  "common.clear": "Clear",
  "common.done": "Done",
  "common.view": "View",
  "common.copy": "Copy",
  "common.refresh": "Refresh",
  "common.more": "More",
  "common.less": "Less",
  "common.show": "Show",
  "common.hide": "Hide",
  "common.enable": "Enable",
  "common.disable": "Disable",

  // Bot Configuration Page
  "bots.configuration.title": "Bot Configuration",
  "bots.configuration.description": "Manage your bot features and settings",
  
  // Feature Cards
  "bots.features.menu.title": "Menu Settings",
  "bots.features.menu.description": "Configure bot commands and responses",
  
  "bots.features.keywords.title": "Keyword Replies",
  "bots.features.keywords.description": "Set up auto-reply rules and triggers",
  
  "bots.features.users.title": "User Management",
  "bots.features.users.description": "View and manage user TGID information",
  
  "bots.features.settings.title": "Basic Settings",
  "bots.features.settings.description": "Configure basic bot parameters and behavior",
  
  // Quick Start Guide
  "bots.quickStart.title": "Quick Start",
  "bots.quickStart.description": "Follow these steps to start configuring your bot",
  
  "bots.quickStart.step1.title": "Set Up Menu Commands",
  "bots.quickStart.step1.description": "Configure basic command menu for easy user interaction",
  
  "bots.quickStart.step2.title": "Configure Keywords",
  "bots.quickStart.step2.description": "Add keyword trigger rules for automated responses",
  
  "bots.quickStart.step3.title": "Manage Users",
  "bots.quickStart.step3.description": "View user list, manage permissions and interaction data",

  // Menu Management
  'menu.drawer.title': 'Configure Bot Menu',
  'menu.drawer.description': 'Set up command menu with drag-and-drop sorting',
  'menu.items.title': 'Menu Items',
  'menu.items.add': 'Add Menu Item',
  'menu.items.new': 'New Menu Item',
  'menu.form.text.label': 'Menu Text',
  'menu.form.text.description': 'Text displayed in the menu',
  'menu.form.command.label': 'Command',
  'menu.form.command.description': 'Command trigger, starts with /',
  'menu.form.command.placeholder': '/start',
  'menu.form.url.label': 'URL',
  'menu.form.url.description': 'Optional: Link to open when clicked',
  'menu.form.url.placeholder': 'https://',
  'menu.actions.save': 'Save Changes',
  'menu.actions.cancel': 'Cancel',
  'menu.delete.title': 'Confirm Delete',
  'menu.delete.description': 'Are you sure you want to delete this menu item? This action cannot be undone.',
  'menu.delete.confirm': 'Confirm Delete',
  'menu.delete.cancel': 'Cancel',
  'menu.messages.loadError': 'Failed to load menu',
  'menu.messages.saveSuccess': 'Menu configuration saved',
  'menu.messages.saveError': 'Failed to save menu configuration',
  'menu.messages.deleteSuccess': 'Menu item deleted',
  'menu.messages.orderUpdateSuccess': 'Menu order updated successfully',
  'menu.messages.orderUpdateError': 'Failed to update menu order',
  'menu.messages.validationError': 'Invalid menu data format',

  // Bot Settings Drawer
  "bot.settings.title": "Bot Settings",
  "bot.settings.avatar.title": "Avatar Settings",
  "bot.settings.basicInfo.title": "Basic Information",
  "bot.settings.webhook.title": "Webhook Configuration",
  
  // Avatar Upload
  "avatar.upload.button": "Upload Avatar",
  "avatar.upload.hint": "Supports JPG, PNG formats, max 5MB",
  "avatar.upload.error.invalidType.title": "Invalid File Format",
  "avatar.upload.error.invalidType.description": "Please upload a JPG or PNG image",
  "avatar.upload.error.tooLarge.title": "File Too Large",
  "avatar.upload.error.tooLarge.description": "Image size cannot exceed 5MB",
  "avatar.upload.error.failed.title": "Upload Failed",
  "avatar.upload.error.failed.description": "Failed to upload image, please try again",
  "avatar.upload.success.title": "Upload Successful",
  "avatar.upload.success.description": "Avatar has been updated",

  // Basic Info Form
  "bot.form.name.label": "Bot Name",
  "bot.form.name.placeholder": "Enter bot name",
  "bot.form.description.label": "Bot Description",
  "bot.form.description.placeholder": "Enter bot description",

  // Webhook Configuration
  "webhook.url.label": "Webhook URL",
  "webhook.url.placeholder": "Enter Webhook URL",
  "webhook.url.description": "URL to receive bot updates",
  "webhook.save.button": "Save",
  "webhook.delete.button": "Delete",
  "webhook.fetch.error.title": "Fetch Failed",
  "webhook.fetch.error.description": "Failed to fetch webhook configuration",
  "webhook.save.success.title": "Save Successful",
  "webhook.save.success.description": "Webhook configuration has been updated",
  "webhook.save.error.title": "Save Failed",
  "webhook.save.error.description": "Failed to save webhook configuration",
  "webhook.delete.success.title": "Delete Successful",
  "webhook.delete.success.description": "Webhook configuration has been deleted",
  "webhook.delete.error.title": "Delete Failed",
  "webhook.delete.error.description": "Failed to delete webhook configuration",
  "webhook.status.pending": "Pending Update",
  "webhook.cancel.button": "Cancel",

  // Webhook Status and Sync
  "webhook.sync.warning.title": "Webhook Configuration Inconsistent",
  "webhook.sync.warning.description": "Telegram platform and local configuration are inconsistent, system will attempt to fix automatically",
  "webhook.status.inconsistent": "Webhook configuration out of sync",
  "webhook.status.active": "Webhook active",
  "webhook.status.error": "Webhook error: {error}",
  "webhook.init.error.title": "Initialization Failed",
  "webhook.init.error.description": "Failed to get webhook configuration, please retry",
  
  // Webhook Operations
  "webhook.update.button": "Update Webhook",
  "webhook.update.success.title": "Update Successful",
  "webhook.update.success.description": "Webhook configuration has been updated",

  // Settings Save
  "bot.settings.save.success.title": "Save Successful",
  "bot.settings.save.success.description": "Bot settings have been updated",
  "bot.settings.save.error.title": "Save Failed",
  "bot.settings.save.error.description": "Failed to update bot settings",
} as const;