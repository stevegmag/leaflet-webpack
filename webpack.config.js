const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './src/app.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'none',
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: true,
                extractComments: 'all',
                chunkFilter: (chunk) => {
                    // Exclude uglification for the `vendor` chunk
                    if ((chunk.name === 'vendor') || (chunk.name === 'node_modules') ) {
                        return false;
                    }

                    return true;
                },
            }),
        ],
    },
    module: {
        rules: [
            { test: /\.js$/,
                exclude: [/(node_modules)/, /(vendor)/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            { test: /\.(sa|sc|c)ss$/,
            // Apply rule for .sass, .scss or .css files
                
                // Set loaders to transform files.
                // Loaders are applying from right to left(!)
                // The first loader will be applied after others
                use: [
                        {
                            loader: MiniCssExtractPlugin.loader
                        },
                        {
                            // This loader resolves url() and @imports inside CSS
                            loader: "css-loader",
                        },
                        {
                            // Then we apply postCSS fixes like autoprefixer and minifying
                            loader: "postcss-loader"
                        },
                        {
                            // First we transform SASS to standard CSS
                            loader: "sass-loader",
                            options: {
                                implementation: require("sass")
                            }
                        }
                    ]
            },
            { test: /\.(png|jpe?g|gif|svg)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            outputPath: 'images'
                        }
                    }
                ]
            },
            { test: /\.(woff|woff2|ttf|otf|eot)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            outputPath: 'fonts'
                        }
                    }
                ]
            }
        ]
    },
    
    plugins: [
        new MiniCssExtractPlugin({
            filename: "main.css"
        })
    ]
};