import path from 'path';

import TerserPlugin from 'terser-webpack-plugin';

const getSourcePath = (...args) => path.resolve('src/assetbundles/cookienotice/src', ...args);
const getPublicPath = (...args) => path.resolve('src/assetbundles/cookienotice/dist', ...args);

export default () => {
    return {
        mode: 'production',
        devtool: false,
        entry: {
            cookienotice: getSourcePath('ts/main.ts'),
        },
        output: {
            publicPath: '/src/assetsbundles/cookienotice',
            path: getPublicPath('js'),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['*', '.tsx', '.ts', '.js', '.json'],
            alias: {
                'wicg-inert': path.resolve('./node_modules/wicg-inert/dist/inert'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        output: {
                            comments: false,
                        },
                    },
                }),
            ],
        },
    };
};