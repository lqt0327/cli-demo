const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const portfinder = require('portfinder')
const path = require("path");
const port = process.env.PORT || 8080


const Params = {
    context: path.join(__dirname, "src"),
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    entry: ["@babel/polyfill", "./index.tsx"],
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js",
    },
    devtool: "source-map",
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist')
        },
        hot: true,  // 热更新
        open: true, // 自动打开浏览器
        https: false,
        compress: true, // 开启压缩
        host: "localhost",
        port: port,
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                loader: "awesome-typescript-loader",
                options: {
                    useBabel: true,
                    babelCore: "@babel/core", // needed for Babel v7
                },
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: "file-loader",
                options: {
                    name: "assets/img/[name].[ext]?[hash]",
                    esModule: false,
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html", //Name of file in ./dist/
            template: "index.html", //Name of template in ./src
            hash: true,
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
        new webpack.HotModuleReplacementPlugin(),
    ],
}

module.exports = new Promise((resolve, reject) => {
    portfinder.basePort = port
    portfinder.getPortPromise()
        .then(newPort => {
            if (port !== newPort) {
                console.log(`${port}端口被占用，开启新端口${newPort}`)
                Params.devServer.port = newPort
            }
            resolve(Params)
        }).catch(error => {
            console.log('没有找到空闲端口，请打开任务管理器杀死进程端口再试', error)
        })
})
