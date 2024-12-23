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
        // 设置模式，影响内置的优化
        mode: argv.mode || 'development',

        // 定义开发工具，生产环境使用 source-map，开发环境使用 eval-source-map
        devtool: isProduction ? 'source-map' : 'eval-source-map',

        // 入口配置
        entry: {
            main: path.resolve(SRC_DIR, 'index.tsx')
        },

        // 输出配置
        output: {
            path: BUILD_DIR,
            // 在生产环境使用内容哈希来支持长期缓存
            filename: isProduction
                ? 'static/js/[name].[contenthash:8].js'
                : 'static/js/[name].bundle.js',
            // 块文件名格式
            chunkFilename: isProduction
                ? 'static/js/[name].[contenthash:8].chunk.js'
                : 'static/js/[name].chunk.js',
            // 资源文件名格式
            assetModuleFilename: 'static/media/[name].[hash:8][ext]',
            // 公共路径，确保在任何路由下资源都能被正确加载
            publicPath: '/',
            // 每次构建前清理输出目录
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
            // HTML 模板插件
            new HtmlWebpackPlugin({
                template: path.join(PUBLIC_DIR, 'index.html'),
                favicon: path.join(PUBLIC_DIR, 'favicon.ico'),
                title: 'Telegram Bot Dashboard',
                meta: {
                    'viewport': 'width=device-width, initial-scale=1, shrink-to-fit=no',
                    'theme-color': '#000000'
                },
                // 确保脚本正确加载
                scriptLoading: 'defer',
                inject: true,
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
            static: {
                directory: PUBLIC_DIR
            },
            port: 8080,
            hot: true,
            open: true,
            compress: true,
            // 支持 HTML5 History API
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

        // 生产环境特定配置
        ...(isProduction ? {
            optimization: {
                splitChunks: {
                    chunks: 'all',
                    name: false, // 不为分割的块指定名称
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name(module) {
                                // 获取包名
                                const packageName = module.context.match(
                                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                                )[1];
                                return `vendor.${packageName.replace('@', '')}`;
                            },
                        },
                    },
                },
                // 使用确定性的哈希
                moduleIds: 'deterministic',
                // 提取运行时代码
                runtimeChunk: 'single'
            },
            performance: {
                hints: 'warning',
                maxEntrypointSize: 512000,
                maxAssetSize: 512000
            }
        } : {})
    };
};