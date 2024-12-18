const sharedConfig = require('@telegram-bot/tailwind-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
    // 继承共享配置
    ...sharedConfig,
    // 可以在这里添加或覆盖项目特定的配置
    content: [
        ...sharedConfig.content,
        // 添加项目特有的内容路径
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/**/*.html"
    ]
}