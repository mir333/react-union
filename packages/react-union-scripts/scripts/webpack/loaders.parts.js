const ExtractCSSChunks = require('extract-css-chunks-webpack-plugin');

const loadJS = cache => ({
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve('babel-loader'),
						options: {
							cacheDirectory: cache,
						},
					},
				],
			},
		],
	},
});

const loadCSS = isServerConfig => ({
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					...(isServerConfig ? [] : [ExtractCSSChunks.loader]),
					{
						loader: require.resolve(`css-loader${isServerConfig ? '/locals' : ''}`),
						options: {
							modules: true,
							localIdentName: '[name]__[local]--[hash:base64:5]',
						},
					},
				],
			},
		],
	},
});

const loadImages = ({ outputMapper }) => ({
	module: {
		rules: [
			{
				test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
				use: [
					{
						loader: require.resolve('url-loader'),
						options: {
							name: `${outputMapper.media}/[name].[ext]`,
						},
					},
				],
			},
		],
	},
});

const loadFiles = ({ outputMapper }) => ({
	module: {
		rules: [
			{
				test: /\.(eot|ttf|wav|mp3|otf)$/,
				use: [
					{
						loader: require.resolve('file-loader'),
						options: {
							name: `${outputMapper.media}/[name].[ext]`,
						},
					},
				],
			},
		],
	},
});

module.exports = {
	loadJS,
	loadCSS,
	loadImages,
	loadFiles,
};
