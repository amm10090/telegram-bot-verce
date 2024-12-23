const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// 定义关键路径
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
        devtool: isProduction ? 'source-map' : 'eval-source-map',

        // 入口配置
        entry: {
            main: path.resolve(SRC_DIR, 'index.tsx')
        },

        // 输出配置
        output: {
            path: BUILD_DIR,
            // 设置 chunk 文件的命名规则
            filename: 'static/js/[name].[contenthash:8].js',
            // 动态导入的文件命名规则
            chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
            // 静态资源的输出规则
            assetModuleFilename: 'static/media/[name].[hash:8][ext]',
            // 确保资源能够被正确访问
            publicPath: '/',
            // 构建前清理输出目录
            clean: true
        },

        // 模块解析配置
        resolve: {
            // 按顺序尝试这些扩展名
            extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
            // 路径别名配置
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
                                importLoaders: 1
                            }
                        },
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
                // 静态资源处理
                {
                    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
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
                    minifyURLs: true
                } : false
            }),

            // 环境变量定义
            new webpack.DefinePlugin({
                'process.env': JSON.stringify({
                    NODE_ENV: isProduction ? 'production' : 'development',
                    PUBLIC_URL: '',
                    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || ''
                })
            }),

            // 提供全局变量
            new webpack.ProvidePlugin({
                React: 'react',
                process: 'process/browser'
            })
        ],

        // 优化配置
        optimization: {
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: Infinity,
                minSize: 20000,
                cacheGroups: {
                    // React 相关库
                    react: {
                        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                        name: 'vendor.react',
                        chunks: 'all',
                        priority: 40
                    },
                    // UI 组件库
                    ui: {
                        test: /[\\/]node_modules[\\/](@radix-ui|@shadcn|class-variance-authority|clsx|tailwind-merge)[\\/]/,
                        name: 'vendor.ui',
                        chunks: 'all',
                        priority: 30
                    },
                    // 数据处理相关库
                    data: {
                        test: /[\\/]node_modules[\\/](axios|recharts|zod|@hookform)[\\/]/,
                        name: 'vendor.data',
                        chunks: 'all',
                        priority: 25
                    },
                    // 其他第三方库
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            const packageName = module.context.match(
                                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                            )[1];
                            return `vendor.${packageName.replace('@', '')}`;
                        },
                        priority: 20
                    },
                    // 公共模块
                    common: {
                        name: 'common',
                        minChunks: 2,
                        priority: 10,
                        reuseExistingChunk: true
                    }
                }
            },
            runtimeChunk: 'single',
            moduleIds: 'deterministic'
        },

        // 开发服务器配置
        devServer: {
            static: {
                directory: PUBLIC_DIR
            },
            port: 8080,
            hot: true,
            open: true,
            compress: true,
            historyApiFallback: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    pathRewrite: { '^/api': '' },
                    changeOrigin: true,
                    logLevel: 'debug'
                }
            }
        },

        // 性能提示配置
        performance: {
            hints: isProduction ? 'warning' : false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        }
    };
};