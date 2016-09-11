'use strict';

module.exports = {
    output: {
        filename: 'app.js',
        sourceMapFilename: '[file].map'
    },
    devtool: 'cheap-source-map',
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: require.resolve('babel-loader'),
                query: {
                    presets: [
                        'babel-preset-es2015',
                        'babel-preset-react'
                    ].map(require.resolve)
                }
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx'],
        alias: {
            'masonry': 'masonry-layout',
            'isotope': 'isotope-layout'
        }
    }
};