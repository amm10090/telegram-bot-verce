// api/config/keyboards.js
export const MAIN_KEYBOARD = {
    reply_markup: {
        keyboard: [
            ['📊 统计', '⚙️ 设置'],
            ['❓ 帮助', '📝 反馈']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

export const SETTINGS_KEYBOARD = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '🌐 语言设置', callback_data: 'settings_language' },
                { text: '⏰ 通知设置', callback_data: 'settings_notifications' }
            ],
            [
                { text: '👤 个人信息', callback_data: 'settings_profile' },
                { text: '🔙 返回', callback_data: 'back_to_main' }
            ]
        ]
    }
};