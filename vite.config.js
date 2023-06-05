import { resolve } from 'path'
import { defineConfig } from 'vite'
import pkg from './package.json'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        [pkg.name]: resolve(__dirname, 'src/index.ts'),
        'plugins': resolve(__dirname, 'src/plugins.ts'),
        'react': resolve(__dirname, 'src/react.ts')
      },
      formats: ['es'],
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
