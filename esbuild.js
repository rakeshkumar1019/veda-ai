const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
	});

	// Build webview separately
	const webviewCtx = await esbuild.context({
		entryPoints: ['webview/index.tsx'],
		bundle: true,
		format: 'iife',
		minify: production,
		sourcemap: !production,
		outfile: 'dist/webview.js',
		platform: 'browser',
		plugins: [
			esbuildProblemMatcherPlugin,
		],
		loader: {
			'.tsx': 'tsx',
			'.ts': 'ts',
			'.js': 'js',
			'.css': 'css',
		},
	});

	// Copy styles.css to dist directory
	fs.copyFileSync(
		path.resolve(__dirname, "webview/styles.css"),
		path.resolve(__dirname, "dist/styles.css")
	);

	if (watch) {
		await Promise.all([ctx.watch(), webviewCtx.watch()]);
	} else {
		await Promise.all([ctx.rebuild(), webviewCtx.rebuild()]);
		await Promise.all([ctx.dispose(), webviewCtx.dispose()]);
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
