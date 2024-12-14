const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'static/js/[name].[contenthash:8].js',
        chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
        publicPath: '/',
        clean: true
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        modules: ['node_modules'],
        alias: {
            '@': path.resolve(__dirname, 'src')
        },
        fallback: {
            "path": false,
            "fs": false
        }
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    browsers: ['last 2 versions', 'not dead']
                                }
                            }],
                            '@babel/preset-react'
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime'
                        ]
                    }
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'public/index.html',
            inject: true,
            minify: process.env.NODE_ENV === 'production' ? {
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
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'public',
                    to: '.',
                    globOptions: {
                        ignore: ['**/index.html']
                    }
                }
            ]
        })
    ],
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
        minimizer: [new TerserPlugin({
            terserOptions: {
                compress: {
                    drop_console: process.env.NODE_ENV === 'production'
                }
            }
        })],
        splitChunks: {
            chunks: 'all',
            name: false
        },
        runtimeChunk: {
            name: 'runtime'
        }
    }
}; 主要修改内容说明：

移除了 ES 模块相关的导入语法：

删除了 import 语句
删除了 fileURLToPath 的使用
使用 require() 替代 import


导出方式改变：

使用 module.exports 替代 export default


    __dirname 的处理：

直接使用 Node.js 内置的 __dirname 变量
移除了 ES 模块相关的 __dirname 计算逻辑