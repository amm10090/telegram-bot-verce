/** @type {import('next').NextConfig} */
const nextConfig = {
    // 启用 React 严格模式，帮助找出潜在问题
    reactStrictMode: true,

    // 允许在页面中使用 SVG 文件
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
}

module.exports = nextConfig