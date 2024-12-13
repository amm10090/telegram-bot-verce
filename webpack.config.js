// webpack.config.js
import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

const PATHS = {
    src: path.resolve(__dirname, './src'),
    public: path.resolve(__dirname, './public'),
    dist: path.resolve(__dirname, './dist'),
};

const config = {
    mode: isProduction ? 'production' : 'development',
    entry: path.join(PATHS.src, 'index.js'),
    output: {
        path: PATHS.dist,
        filename: 'static/js/[name].[contenthash:8].js',
        chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
        publicPath: '/',
        clean: true,
    },

    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        alias: {
            '@': PATHS.src,
        },
    },

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
        ],
    },

    plugins: [
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
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: PATHS.public,
                    to: PATHS.dist,
                    globOptions: {
                        ignore: ['**/index.html'],
                    },
                    noErrorOnMissing: true,
                },
            ],
        }),
    ],

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

    performance: {
        hints: isProduction ? 'warning' : false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },

    devtool: isDevelopment ? 'eval-source-map' : false,

    stats: {
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
    },
};

export default config;