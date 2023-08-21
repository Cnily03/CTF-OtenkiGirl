const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require("terser-webpack-plugin");

const CONFIG = require('./config');
const DEFAULT_CONFIG = require('./config.default');

const MODE = (process.env.NODE_ENV || "production").trim() === "production" ? "production" : "development";
const IS_DEV = MODE === "development";

const StyleLoader = MiniCssExtractPlugin.loader || 'style-loader';

module.exports = {
    entry: {
        index: path.join(__dirname, './src/scripts/index.mjs'),
        sw: path.join(__dirname, './src/scripts/sw.mjs')
    },

    output: {
        path: path.join(__dirname, './static/v'),
        filename: '[name].js'
    },

    mode: MODE,
    devtool: IS_DEV ? "source-map" : undefined,
    devServer: {
        static: {
            directory: path.join(__dirname, './static/v')
        },
        compress: true,
        port: CONFIG.webpack_dev_port || DEFAULT_CONFIG.webpack_dev_port,
    },

    module: {
        rules: [{ // CSS
            test: /\.css$/i,
            use: [StyleLoader, 'css-loader']
        }, { // SCSS
            test: /\.s[ac]ss$/i,
            use: [StyleLoader, 'css-loader', 'sass-loader']
        }, { // Image File
            test: /\.(png|jpe?g|svg|gif|webp)$/i,
            type: 'asset',
            generator: {
                filename: 'images/[hash][ext][query]'
            },
            parser: {
                dataUrlCondition: {
                    maxSize: 32 * 1024 // 限制大小（单位：字节）
                }
            }
        }].concat(IS_DEV ? [ // Dev Only
        ] : [ // Production Only
            { // JS
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ])
    },

    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
                "**/*",
                path.join(__dirname, './static/sw.js')
            ]
        }),
        new webpack.DefinePlugin({
            $webpack$_app_name: JSON.stringify(CONFIG.app_name || DEFAULT_CONFIG.app_name),
            $webpack$_default_lang: JSON.stringify(CONFIG.default_lang || DEFAULT_CONFIG.default_lang),
            $webpack$_default_language: JSON.stringify(require(path.resolve(__dirname, `./static/lang/${CONFIG.default_lang || DEFAULT_CONFIG.default_lang}.json`), 'utf-8'))
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        })
    ].concat(IS_DEV ? [ // Dev Only
    ] : [ // Production Only
    ]),

    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(), // 优化 Minify CSS
            new TerserWebpackPlugin({
                parallel: true,
                extractComments: false,
                terserOptions: {
                    ecma: undefined,
                    parse: {},
                    compress: {
                        dead_code: false, // 移除没被引用的代码
                        loops: true, // 当循环的判断条件可以确定时，对其进行优化
                        drop_debugger: false,
                        drop_console: false, // 移除全部 console
                        pure_funcs: IS_DEV ? [] : ['console.log'] // 移除特定函数
                    }
                }
            })
        ],
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@js': path.resolve(__dirname, './src/scripts'),
            '@css': path.resolve(__dirname, './src/stylesheets'),
            '@static': path.resolve(__dirname, './static')
        }
    },

    performance: {
        hints: false
    }
}