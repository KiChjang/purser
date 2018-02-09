import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { browser, main, module } from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/index.js',
    output: {
      file: browser,
      format: 'umd',
      name: 'unnamedWalletLibrary',
    },
		plugins: [
			resolve(), // so Rollup can find dependencies
			commonjs(), // so Rollup can convert dependencies to an ES module
			babel({
				exclude: ['node_modules/**']
			})
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// the `targets` option which can specify `dest` and `format`)
	{
		input: 'src/index.js',
		// external: ['ms'],
		output: [
			{ file: main, format: 'cjs' },
			{ file: module, format: 'es' }
		],
		plugins: [
			babel({
				exclude: ['node_modules/**']
			})
		]
	},
];