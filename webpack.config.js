const path = require('path');

// 用于调试的函数
function getAbsolutePath(relativePath) {
    const absolutePath = path.resolve(__dirname, relativePath);
    console.log(`Resolving path: ${relativePath} -> ${absolutePath}`);
    return absolutePath;
}

module.exports = {
    // 启用详细的错误信息
    stats: {
        errorDetails: true
    },

    // 入口配置
    entry: getAbsolutePath('./src/index.js'),

    // 输出配置
    output: {
        path: getAbsolutePath('./dist'),
        filename: 'bundle.js',
        publicPath: '/'
    },

    // 模块处理规则
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },

    // 解析配置
    resolve: {
        extensions: ['.js', '.jsx'],
        // 添加模块解析路径
        modules: [
            getAbsolutePath('src'),
            'node_modules'
        ]
    },

    // 开发工具配置
    devtool: 'source-map',

    // 模式设置
    mode: 'development'
};