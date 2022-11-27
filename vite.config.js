import { resolve } from 'path'
import { defineConfig } from 'vite'
import pkg from './package.json'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: pkg.name,
      formats: ['es', 'umd'],
      fileName: (format) => `${pkg.name}.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'rxjs', 'rxjs/operators', 'immer'],
      output: {
        globals: {
          'react': 'React',
          'rxjs': 'rxjs',
          'rxjs/operators': 'rxjs.operators',
          'immer': 'immer',
        },
      },
    },
  },
  plugins: [dts()]
})
