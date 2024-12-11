// 引入核心模块
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/**
 * 路径解析助手函数
 * 用于将相对路径转换为绝对路径，并在控制台输出转换信息
 * @param {string} relativePath - 相对路径
 * @returns {string} - 绝对路径
 */
const getAbsolutePath = (relativePath) => {
    const absolutePath = path.resolve(__dirname, relativePath);
    console.log(`路径解析: ${relativePath} -> ${absolutePath}`);
    return absolutePath;
};

// webpack 主配置
module.exports = {
    // 入口配置
    entry: getAbsolutePath('./src/index.js'),

    // 输出配置
    output: {
        // 输出目录为 dist
        path: getAbsolutePath('./dist'),
        // 主文件使用内容哈希命名
        filename: 'static/js/[name].[contenthash:8].js',
        // 块文件使用内容哈希命名
        chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
        // 资源文件路径前缀
        publicPath: '/',
        // 每次构建前清理输出目录
        clean: true,
        // 确保跨平台路径正确
        crossOriginLoading: 'anonymous',
        // 设置资源文件的输出路径
        assetModuleFilename: 'static/media/[name].[hash:8][ext]'
    },

    // 优化配置
    optimization: {
        // 开启代码压缩
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,    // 移除 console
                        drop_debugger: true,   // 移除 debugger
                        pure_funcs: ['console.log']  // 移除 console.log
                    },
                    format: {
                        comments: false,      // 移除注释
                    },
                },
                extractComments: false,      // 不将注释提取到单独的文件
            }),
        ],
        // 代码分割配置
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            maxAsyncRequests: 30,
            minSize: 20000,
            maxSize: 244000,
            cacheGroups: {
                // React 核心库
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                    name: 'static/js/react',
                    chunks: 'all',
                    priority: 40,
                    enforce: true,
                },
                // Recharts 图表库（异步加载）
                recharts: {
                    test: /[\\/]node_modules[\\/](recharts|d3-[^/]+)[\\/]/,
                    name: 'static/js/recharts',
                    chunks: 'async',
                    priority: 30,
                    enforce: true,
                },
                // 其他第三方库
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'static/js/vendors',
                    chunks: 'all',
                    priority: 20,
                    minChunks: 2,
                },
                // 公共代码
                common: {
                    name: 'static/js/common',
                    minChunks: 2,
                    priority: 10,
                    reuseExistingChunk: true,
                },
            },
        },
        // 运行时代码
        runtimeChunk: {
            name: 'static/js/runtime',
        },
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
    },

    // 模块处理规则
    module: {
        rules: [
            // JavaScript 和 JSX 文件处理
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    browsers: [
                                        'last 2 versions',
                                        '> 1%',
                                        'not dead'
                                    ]
                                },
                                modules: false,
                                useBuiltIns: 'usage',
                                corejs: 3,
                            }],
                            ['@babel/preset-react', {
                                runtime: 'automatic'
                            }]
                        ],
                    },
                },
            },
            // 静态资源处理
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024, // 10kb 以下的文件内联为 base64
                    },
                },
            },
        ],
    },

    // 插件配置
    plugins: [
        // 生成 HTML 文件
        new HtmlWebpackPlugin({
            template: getAbsolutePath('./public/index.html'),
            filename: 'index.html',
            inject: true,
            minify: {
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
            },
        }),
        // 复制公共资源
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: getAbsolutePath('./public'),
                    to: getAbsolutePath('./dist'),
                    globOptions: {
                        ignore: ['**/index.html'], // 排除 index.html
                    },
                },
            ],
        }),
    ],

    // 解析配置
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: [getAbsolutePath('src'), 'node_modules'],
        alias: {
            '@': getAbsolutePath('src'),
            'components': getAbsolutePath('src/components'),
        },
    },

    // 模式配置
    mode: 'production',

    // 性能配置
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
        hints: 'warning',
        // 排除需要忽略的文件
        assetFilter: function (assetFilename) {
            return !assetFilename.endsWith('.map');
        },
    },

    // 统计信息配置
    stats: {
        builtAt: true,
        timings: true,
        errorDetails: true,
        colors: true,
        assets: true,
    },
};