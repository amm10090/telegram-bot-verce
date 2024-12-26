/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // 在生产环境中禁用类型检查
    // 确保在开发时重新启用它！
    ignoreBuildErrors: true,
  },
}

export default nextConfig 