const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 环境变量
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// 路径配置
const PATHS = {
    src: path.resolve(__dirname, './src'),
    public: path.resolve(__dirname, './public'),
    dist: path.resolve(__dirname, './dist'),
};

// webpack 配置
module.exports = {
    // 设置模式
    mode: isProduction ? 'production' : 'development',

    // 入口配置
    entry: path.join(PATHS.src, 'index.js'),

    // 输出配置
    output: {
        path: PATHS.dist,
        filename: 'static/js/[name].[contenthash:8].js',
        chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
        publicPath: '/',
        clean: true,
    },

    // 模块解析配置
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            '@': PATHS.src,
        },
    },

    // 模块规则
    module: {
        rules: [
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
                                    browsers: ['last 2 versions', '> 1%', 'not dead'],
                                },
                                modules: false,
                                useBuiltIns: 'usage',
                                corejs: 3,
                            }],
                            ['@babel/preset-react', {
                                runtime: 'automatic',
                            }],
                        ],
                    },
                },
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024, // 10KB
                    },
                },
            },
        ],
    },

    // 插件配置
    plugins: [
        // 生成 HTML 文件
        new HtmlWebpackPlugin({
            template: path.join(PATHS.public, 'index.html'),
            filename: 'index.html',
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
            } : false,
        }),

        // 复制静态资源
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: PATHS.public,
                    to: PATHS.dist,
                    globOptions: {
                        ignore: ['**/index.html'],
                    },
                    noErrorOnMissing: true, // 防止找不到文件报错
                },
            ],
        }),
    ],

    // 优化配置
    optimization: {
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: isProduction,
                        drop_debugger: isProduction,
                    },
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
        splitChunks: {
            chunks: 'all',
            name: false,
        },
    },

    // 性能提示
    performance: {
        hints: isProduction ? 'warning' : false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },

    // 开发工具
    devtool: isDevelopment ? 'eval-source-map' : false,

    // 统计信息
    stats: {
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
        reasons: isDevelopment,
        errorDetails: true,
    },
};