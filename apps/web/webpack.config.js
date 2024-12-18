const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// 调整路径以适应新的项目结构
const ROOT_DIR = path.resolve(__dirname);
const SRC_DIR = path.resolve(ROOT_DIR, 'src');
const BUILD_DIR = path.resolve(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: argv.mode || 'development',
        entry: {
            main: path.resolve(SRC_DIR, 'index.tsx')
        },
        output: {
            path: BUILD_DIR,
            filename: isProduction ? '[name].[contenthash].js' : '[name].bundle.js',
            publicPath: isProduction ? '/' : '/', // 确保在生产环境中正确设置
            clean: true,
            assetModuleFilename: 'assets/[hash][ext][query]'

        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
            alias: {
                '@': SRC_DIR,
                '@components': path.resolve(SRC_DIR, 'components'),
                '@lib': path.resolve(SRC_DIR, 'lib'),
                '@hooks': path.resolve(SRC_DIR, 'hooks'),
                '@contexts': path.resolve(SRC_DIR, 'contexts'),
                '@types': path.resolve(SRC_DIR, 'types')
            }
        },

        // 模块规则配置
        module: {
            rules: [
                // TypeScript 和 React 文件处理
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: !isProduction, // 开发环境下只转译，不做类型检查以提高速度
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
                // 图片和字体文件处理
                {
                    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 10 * 1024 // 10KB
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
                'process.env': JSON.stringify(process.env),
                'process.env.NODE_ENV': JSON.stringify(
                    isProduction ? 'production' : 'development'
                )
            }),
            // 提供全局变量
            new webpack.ProvidePlugin({
                React: 'react',
                process: 'process/browser'
            }),
            // 添加 process 插件
            new webpack.ProvidePlugin({
                process: 'process/browser'
            }),
            new webpack.DefinePlugin({
                'process.env': JSON.stringify({
                    ...process.env,
                    // 确保 Vercel 环境变量可用
                    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
                    NODE_ENV: isProduction ? 'production' : 'development'
                })
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
            // 启用热模块替换
            hot: true,
            // 自动打开浏览器
            open: true,
            // 启用 gzip 压缩
            compress: true,
            // 支持 HTML5 History API
            historyApiFallback: true,
            // 代理配置
            proxy: {
                '/api': {
                    target: 'http://localhost:3000',
                    pathRewrite: { '^/api': '' },
                    changeOrigin: true
                }
            }
        },

        // 优化配置
        // 为 Vercel 环境添加特定的优化配置
        optimization: {
            ...(!isProduction ? {} : {
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    minChunks: 1,
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
                    cacheGroups: {
                        vendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10,
                            reuseExistingChunk: true,
                            // 添加这个配置以优化缓存
                            name(module) {
                                const packageName = module.context.match(
                                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                                )[1];
                                return `vendor.${packageName.replace('@', '')}`;
                            }
                        },
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true
                        }
                    }
                },
                // 确保生成稳定的模块标识符
                moduleIds: 'deterministic',
                // 提取 webpack 运行时代码
                runtimeChunk: 'single'
            })
        }
    };

    // 在生产环境中添加额外的性能优化
    if (isProduction) {
        config.performance = {
            hints: 'warning',
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        };
    }

    return config;
};