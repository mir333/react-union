const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const cheerio = require('cheerio');
const { RenderingContext, scan } = require('react-union');
const { flushChunkNames } = require('react-universal-component/server');
const { default: flushChunks } = require('webpack-flush-chunks');

const { hoistComponentStatics, addInitialPropsToConfigs } = require('./utils');

module.exports = handleRequest => {
	const app = new Koa();

	app.use(bodyParser({ enableTypes: ['text'] }));

	app.use(async ctx => {
		// TODO: when you GET on '/' or '/health', it should return a 200 saying that it is running
		const document_$ = cheerio.load(ctx.request.body);
		const head = document_$('head');
		const body = document_$('body');
		const context = { head, body, ctx };

		const render = async (reactElement, routes) => {
			const scanResult = scan(routes, document_$);
			const { configs } = scanResult;

			// NOTE: https://github.com/faceyspacey/react-universal-component#static-hoisting
			hoistComponentStatics(configs);

			const newConfigs = await addInitialPropsToConfigs(configs, context);
			const newScanResult = { ...scanResult, configs: newConfigs };

			const renderingContextProps = {
				value: {
					isServer: true,
					scanResult: newScanResult,
				},
			};

			const wrappedElement = React.createElement(
				RenderingContext.Provider,
				renderingContextProps,
				reactElement
			);

			const rawHtml = ReactDOMServer.renderToString(wrappedElement);

			const raw_$ = cheerio.load(rawHtml);

			raw_$('[data-union-portal]').each((_, widget) => {
				const $widget = raw_$(widget);
				const id = $widget.data('union-portal');
				const selector = `#${id}`;
				const widgetHtml = $widget.html();

				document_$(selector).html(widgetHtml);
			});
		};

		await handleRequest({ render, ...context });

		// NOTE: this variable is defined in react-union-scripts' build.js (prepended to the bundle)
		// eslint-disable-next-line no-undef
		const chunks = flushChunks(SSR_CLIENT_STATS, {
			chunkNames: flushChunkNames(),
			before: ['runtime', 'vendor'],
			after: ['main'],
		});

		const { styles, cssHash, js } = chunks;

		head.append(styles.toString());
		body.append(cssHash.toString());
		body.append(js.toString());

		ctx.body = document_$.html();
	});

	// TODO: use process.env.SOMETHING
	const port = 3303;
	app.listen(port);

	console.log(`🚀 The SSR server is listening on port ${port} 🚀`);
};