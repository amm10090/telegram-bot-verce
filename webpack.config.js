// 引入所需的 Node.js 核心模块
const path = require('path');

/**
 * 路径解析助手函数
 * 用于将相对路径转换为绝对路径，并在控制台输出转换信息
 * 这对于调试构建过程中的路径问题非常有帮助
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
    // webpack 从这里开始构建依赖图
    entry: getAbsolutePath('./src/index.js'),

    // 输出配置
    // 定义最终构建产物的输出方式
    output: {
        // 构建产物的输出目录
        path: getAbsolutePath('./dist'),
        // 使用内容哈希的文件名，确保长期缓存的有效性
        filename: '[name].[contenthash:8].js',
        // 异步加载的块文件名格式
        chunkFilename: '[name].[contenthash:8].chunk.js',
        // 资源文件的公共访问路径
        publicPath: '/',
        // 每次构建前清理输出目录
        clean: true
    },

    // 优化配置
    // 这部分配置决定了如何优化最终的打包结果
    optimization: {
        // 代码分割配置
        splitChunks: {
            chunks: 'all',         // 对所有类型的模块进行分割
            maxInitialRequests: 25, // 入口点最大并行请求数
            maxAsyncRequests: 30,   // 异步加载时最大并行请求数
            minSize: 20000,         // 生成块的最小体积
            maxSize: 244000,        // 块的最大体积，超过会尝试进一步分割

            // 缓存组配置
            cacheGroups: {
                // React 相关库打包配置
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                    name: 'react',
                    chunks: 'all',
                    priority: 40,    // 最高优先级
                    enforce: true    // 强制创建这个块
                },

                // Recharts 图表库配置
                // 由于图表不一定在首屏使用，设置为异步加载
                recharts: {
                    test: /[\\/]node_modules[\\/](recharts|d3-[^/]+)[\\/]/,
                    name: 'recharts',
                    chunks: 'async', // 异步加载，减小首屏加载体积
                    priority: 30,
                    enforce: true
                },

                // 其他第三方库配置
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 20,
                    minChunks: 2     // 被引用两次以上的才会被打包
                },

                // 公共模块配置
                common: {
                    name: 'common',
                    minChunks: 2,    // 至少被两个chunk引用
                    priority: 10,
                    reuseExistingChunk: true
                }
            }
        },

        // 运行时代码分割
        runtimeChunk: {
            name: 'runtime'    // 将 webpack 运行时代码提取到单独文件
        },

        // 使用确定性的模块标识符
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',

        // 启用副作用分析，有助于去除未使用的代码
        sideEffects: true
    },

    // 模块处理规则
    module: {
        rules: [
            {
                // JavaScript 和 JSX 文件的处理规则
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,    // 启用缓存，提高构建速度
                        cacheCompression: false, // 禁用缓存文件压缩
                        presets: [
                            ['@babel/preset-env', {
                                // 目标浏览器配置
                                targets: {
                                    browsers: [
                                        'last 2 versions',
                                        '> 1%',
                                        'not dead'
                                    ]
                                },
                                modules: false,     // 保留 ES 模块语法
                                useBuiltIns: 'usage', // 按需添加 polyfill
                                corejs: 3
                            }],
                            ['@babel/preset-react', {
                                runtime: 'automatic' // 使用新的 JSX 转换
                            }]
                        ]
                    }
                }
            }
        ]
    },

    // 解析配置
    resolve: {
        // 自动解析的文件扩展名
        extensions: ['.js', '.jsx'],
        // 模块搜索路径
        modules: [
            getAbsolutePath('src'),
            'node_modules'
        ],
        // 路径别名配置
        alias: {
            '@': getAbsolutePath('src'),
            'components': getAbsolutePath('src/components')
        }
    },

    // 生产环境配置
    mode: 'production',

    // 性能提示配置
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
        hints: 'warning'
    },

    // 构建统计信息配置
    stats: {
        builtAt: true,      // 显示构建时间信息
        timings: true,      // 显示构建耗时信息
        errorDetails: true, // 显示错误详细信息
        colors: true,       // 使用彩色输出
        assets: true       // 显示资源信息
    }
};