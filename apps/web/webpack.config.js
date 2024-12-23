// apps/web/webpack.config.js

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// 定义关键路径
// __dirname 在这里指的是 apps/web 目录
const ROOT_DIR = path.resolve(__dirname);
const SRC_DIR = path.resolve(ROOT_DIR, 'src');
const BUILD_DIR = path.resolve(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

module.exports = (env, argv) => {
    // 判断是否为生产环境
    const isProduction = argv.mode === 'production';

    return {
        // 设置模式，这会启用 webpack 的内置优化
        mode: argv.mode || 'development',

        // 设置 source map 类型
        // 生产环境使用 source-map 以获得更好的调试体验
        // 开发环境使用 eval-source-map 以获得更快的构建速度
        devtool: isProduction ? 'source-map' : 'eval-source-map',

        // 入口配置，指定应用的主入口文件
        entry: {
            main: path.resolve(SRC_DIR, 'index.tsx')
        },

        // 输出配置，定义构建产物的输出位置和命名方式
        output: {
            // 输出目录为 dist
            path: BUILD_DIR,
            // 主文件的输出位置和命名规则
            filename: 'static/js/[name].[contenthash:8].js',
            // 代码分割后的块文件命名规则
            chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
            // 静态资源的输出位置和命名规则
            assetModuleFilename: 'static/media/[name].[hash:8][ext]',
            // 公共路径，用于确保资源能够被正确访问
            publicPath: '/',
            // 构建前清理输出目录
            clean: true
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
                            // 开发环境下只转译不做类型检查，加快构建速度
                            transpileOnly: !isProduction,
                            compilerOptions: {
                                module: 'esnext'
                            }
                        }
                    }
                },
                // CSS 文件处理
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                // 启用 CSS 模块化
                                modules: {
                                    auto: true,
                                    localIdentName: isProduction
                                        ? '[hash:base64]'
                                        : '[path][name]__[local]'
                                }
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        'tailwindcss',
                                        'autoprefixer',
                                    ]
                                }
                            }
                        }
                    ]
                },
                // 静态资源处理
                {
                    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            // 10KB 以下的文件转换为 DataURL
                            maxSize: 10 * 1024
                        }
                    }
                }
            ]
        },

        // 插件配置
        plugins: [
            // HTML 模板插件，用于生成 HTML 文件
            new HtmlWebpackPlugin({
                // 使用的 HTML 模板文件
                template: path.join(PUBLIC_DIR, 'index.html'),
                // 网站图标
                favicon: path.join(PUBLIC_DIR, 'favicon.ico'),
                // 页面标题
                title: 'Telegram Bot Dashboard',
                // HTML meta 标签配置
                meta: {
                    'viewport': 'width=device-width, initial-scale=1, shrink-to-fit=no',
                    'theme-color': '#000000'
                },
                // 确保脚本正确加载
                scriptLoading: 'defer',
                // 自动注入生成的文件
                inject: true,
                // 生产环境下压缩 HTML
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

            // 定义环境变量
            new webpack.DefinePlugin({
                'process.env': JSON.stringify({
                    NODE_ENV: isProduction ? 'production' : 'development',
                    // 添加其他环境变量
                    PUBLIC_URL: '',
                    // API 相关配置
                    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
                })
            }),

            // 提供全局变量
            new webpack.ProvidePlugin({
                React: 'react',
                process: 'process/browser'
            })
        ],

        // 开发服务器配置
        devServer: {
            // 静态文件目录
            static: {
                directory: PUBLIC_DIR
            },
            // 开发服务器端口
            port: 8080,
            // 启用热更新
            hot: true,
            // 自动打开浏览器
            open: true,
            // 启用 gzip 压缩
            compress: true,
            // 支持 HTML5 History API 路由
            historyApiFallback: true,
            // 开发环境的代理配置
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    pathRewrite: { '^/api': '' },
                    changeOrigin: true,
                    logLevel: 'debug'
                }
            }
        },

        // 优化配置
        optimization: {
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: Infinity,
                minSize: 0,
                cacheGroups: {
                    // 第三方模块单独打包
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            // 获取包名，创建更细粒度的块
                            const packageName = module.context.match(
                                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                            )[1];
                            return `vendor.${packageName.replace('@', '')}`;
                        },
                        priority: 20
                    },
                    // 共用模块打包
                    common: {
                        minChunks: 2,
                        priority: 10,
                        reuseExistingChunk: true
                    }
                }
            },
            // 将 runtime 代码拆分为单独的块
            runtimeChunk: 'single',
            // 使用确定性的模块 ID
            moduleIds: 'deterministic'
        },

        // 性能提示配置
        performance: {
            hints: 'warning',
            // 入口文件大小限制：500KB
            maxEntrypointSize: 512000,
            // 单个资源大小限制：500KB
            maxAssetSize: 512000
        }
    };
};