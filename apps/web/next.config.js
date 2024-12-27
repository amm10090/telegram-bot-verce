/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'development',
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig; 