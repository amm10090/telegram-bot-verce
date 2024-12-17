const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const WEB_DIR = path.resolve(__dirname, 'Web');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: argv.mode || 'development',
        entry: path.join(WEB_DIR, 'src/pages/index.tsx'),
        output: {
            path: path.resolve(WEB_DIR, 'dist'),
            filename: isProduction ? '[name].[contenthash].js' : 'bundle.js',
            publicPath: '/',
            clean: true // 在每次构建前清理输出目录
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx'],
            alias: {
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
                template: path.join(WEB_DIR, 'public/index.html'),
                minify: isProduction ? {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                } : false
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
                directory: path.join(WEB_DIR, 'public'),
            },
            port: 8082,
            hot: true,
            open: true,
            historyApiFallback: true,
        },
        ...(isProduction ? {
            optimization: {
                splitChunks: {
                    chunks: 'all',
                },
                minimize: true,
            },
        } : {})
    };
};