const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// 获取Web目录的绝对路径
const WEB_DIR = path.resolve(__dirname, 'Web');

module.exports = {
    mode: 'development',
    // 入口文件改为Web目录下的路径
    entry: path.join(WEB_DIR, 'src/pages/index.tsx'),
    output: {
        path: path.resolve(WEB_DIR, 'dist'),
        filename: 'bundle.js',
        publicPath: '/',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            // 更新别名以指向Web目录下的src
            '@': path.resolve(WEB_DIR, 'src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
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
                                    'autoprefixer',
                                ],
                            },
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            // 指定模板文件的路径
            template: path.join(WEB_DIR, 'public/index.html'),
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    devServer: {
        static: {
            // 指定静态文件目录
            directory: path.join(WEB_DIR, 'public'),
        },
        port: 8082,
        hot: true,
        open: true,
        historyApiFallback: true,
    },
};