import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
	input: 'main.ts',
	// rollup.config.mjs
	output: {
		dir: '.',
		format: 'cjs',
		exports: 'default',
		sourcemap: true
	},
	external: ['obsidian'],
	plugins: [
		nodeResolve({ browser: true }),
		typescript()
	]
};
