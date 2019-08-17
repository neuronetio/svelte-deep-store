import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
export default [
  {
    input: 'index.js',
    output: {
      file: 'index.cjs.js',
      format: 'cjs'
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs()
    ]
  },
  {
    input: 'index.js',
    output: {
      name: 'svelte-deep-store',
      file: 'index.umd.js',
      format: 'umd'
    },
    plugins: [
      resolve({
        browser: true
      })
    ]
  }
];
