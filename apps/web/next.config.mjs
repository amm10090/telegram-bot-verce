import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@workspace/ui"],
  experimental: {
    turbo: {
      rules: {
        // 配置 SVG 处理
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        }
      },
      // 配置模块解析策略
      moduleIdStrategy: process.env.NODE_ENV === 'development' ? 'named' : 'deterministic',
      // 配置扩展名解析顺序
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.css'],
      // 配置内存限制（可选）
      memoryLimit: 4000 * 1024 * 1024, // 4GB
    },
    optimizePackageImports: ['@workspace/ui']
  },
  // 开发环境的配置
  devIndicators: {
    buildActivity: true,
    buildError: true,
  },
  // 优化开发服务器性能
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // 配置 webpack
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    // 添加路径别名配置
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
      '@components': path.join(__dirname, 'components'),
      '@lib': path.join(__dirname, 'lib'),
      '@utils': path.join(__dirname, 'utils'),
      '@hooks': path.join(__dirname, 'hooks'),
      '@contexts': path.join(__dirname, 'contexts'),
      '@LocaleContext': path.join(__dirname, 'contexts'),
      '@ThemeContext': path.join(__dirname, 'contexts')
    };
    return config;
  },
}

export default nextConfig
