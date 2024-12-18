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
            publicPath: '/',
            clean: true
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
        optimization: {
            // 只在生产环境启用优化
            ...(isProduction ? {
                // 分块策略
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
                            reuseExistingChunk: true
                        },
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true
                        }
                    }
                },
                // 启用压缩
                minimize: true
            } : {}),
            // 在开发环境下也启用的优化项
            moduleIds: 'deterministic',
            runtimeChunk: 'single'
        },

        // 性能提示配置
        performance: {
            hints: isProduction ? 'warning' : false,
            maxAssetSize: 512000,
            maxEntrypointSize: 512000
        },

        // 开发工具配置
        devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

        // 统计信息配置
        stats: {
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false
        }
    };
};