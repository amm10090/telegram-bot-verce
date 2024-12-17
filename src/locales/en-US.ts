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
  'preferences.theme.system': 'System Default',
  'preferences.language.label': 'Language',
  'preferences.language.description': 'Select your preferred language',
  'preferences.autoUpdate.label': 'Automatic Updates',
  'preferences.autoUpdate.description': 'Keep the application up to date automatically',
  'preferences.betaFeatures.label': 'Beta Features',
  'preferences.betaFeatures.description': 'Try out new features before they\'re released',
  'preferences.button.save': 'Save Preferences',
    'settings.notifications.title':'Notification Settings',

}

