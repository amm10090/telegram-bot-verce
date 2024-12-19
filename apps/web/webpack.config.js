// webpack.config.js

// 导入必要的依赖
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// 定义项目的关键路径
// 这些路径常量可以帮助我们在配置中保持一致的路径引用
const ROOT_DIR = path.resolve(__dirname);
const SRC_DIR = path.resolve(ROOT_DIR, 'src');
const BUILD_DIR = path.resolve(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

// webpack 配置生成函数
// env：环境变量对象
// argv：webpack 命令行参数对象
module.exports = (env, argv) => {
    // 根据 webpack mode 判断是否为生产环境
    const isProduction = argv.mode === 'production';

    // webpack 配置对象
    return {
        // 设置模式，如果未指定则默认为开发模式
        mode: argv.mode || 'development',

        // 入口配置
        entry: {
            main: path.resolve(SRC_DIR, 'index.tsx')
        },

        // 输出配置
        output: {
            path: BUILD_DIR,
            // 在生产环境使用内容哈希来支持长期缓存
            filename: isProduction ? '[name].[contenthash].js' : '[name].bundle.js',
            publicPath: '/',
            // 每次构建前清理输出目录
            clean: true,
            // 自定义静态资源输出规则
            assetModuleFilename: 'assets/[hash][ext][query]'
        },

        // 模块解析配置
        resolve: {
            // 按顺序尝试这些扩展名
            extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
            // 路径别名配置，简化导入语句
            alias: {
                '@': SRC_DIR,
                '@components': path.resolve(SRC_DIR, 'components'),
                '@lib': path.resolve(SRC_DIR, 'lib'),
                '@hooks': path.resolve(SRC_DIR, 'hooks'),
                '@contexts': path.resolve(SRC_DIR, 'contexts'),
                '@types': path.resolve(SRC_DIR, 'types')
            }
        },

        // 模块处理规则
        module: {
            rules: [
                // TypeScript 和 React 文件处理
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            // 在开发环境下只转译不做类型检查，加快构建速度
                            transpileOnly: !isProduction,
                            compilerOptions: {
                                module: 'esnext'
                            }
                        }
                    }
                },
                // CSS 文件处理，包括 Tailwind 集成
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        'tailwindcss',
                                        'autoprefixer'
                                    ]
                                }
                            }
                        }
                    ]
                },
                // 静态资源处理（图片、字体等）
                {
                    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            // 10KB 以下的文件将被转换为 DataURL
                            maxSize: 10 * 1024
                        }
                    }
                }
            ]
        },

        // 插件配置
        plugins: [
            // HTML 模板插件配置
            new HtmlWebpackPlugin({
                template: path.join(PUBLIC_DIR, 'index.html'),
                favicon: path.join(PUBLIC_DIR, 'favicon.ico'),
                // 在生产环境下压缩 HTML
                minify: isProduction ? {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true,
                } : false
            }),

            // 环境变量定义
            // 将所有环境变量的定义集中在这里，避免多处定义造成的冲突
            new webpack.DefinePlugin({
                'process.env': JSON.stringify({
                    // 展开所有已有的环境变量
                    ...process.env,
                    // 明确定义关键环境变量
                    NODE_ENV: isProduction ? 'production' : 'development',
                    // API 相关配置
                    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
                    // 服务器配置
                    PORT: process.env.PORT || 3001,
                    // Vercel 部署相关
                    VERCEL: process.env.VERCEL || ''
                })
            }),

            // 提供全局变量和 polyfills
            new webpack.ProvidePlugin({
                React: 'react',
                process: 'process/browser'
            })
        ],

        // 开发服务器配置
        devServer: {
            // 静态文件服务配置
            static: {
                directory: PUBLIC_DIR
            },
            port: 8080,
            // 启用热模块替换
            hot: true,
            // 自动打开浏览器
            open: true,
            // 启用 gzip 压缩
            compress: true,
            // 支持 HTML5 History API
            historyApiFallback: true,
            // API 代理配置
            proxy: {
                '/api': {
                    target: 'http://localhost:3000',
                    pathRewrite: { '^/api': '' },
                    changeOrigin: true
                }
            }
        },

        // 生产环境特定配置
        ...(isProduction ? {
            // 代码分割和优化配置
            optimization: {
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    minChunks: 1,
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
                    cacheGroups: {
                        // 第三方库分割配置
                        vendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10,
                            reuseExistingChunk: true,
                            // 根据包名生成文件名
                            name(module) {
                                const packageName = module.context.match(
                                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                                )[1];
                                return `vendor.${packageName.replace('@', '')}`;
                            }
                        },
                        // 默认分割配置
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true
                        }
                    }
                },
                // 使用确定性的模块标识符
                moduleIds: 'deterministic',
                // 提取 webpack 运行时代码
                runtimeChunk: 'single'
            },
            // 性能提示配置
            performance: {
                hints: 'warning',
                // 入口文件大小限制：500KB
                maxEntrypointSize: 512000,
                // 单个资源大小限制：500KB
                maxAssetSize: 512000
            }
        } : {})
    };
};