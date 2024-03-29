import { resolve } from 'path'
import { defineConfig } from 'vite'
import pkg from './package.json'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    alias: [
      { find: /^zhuangtai$/, replacement: './src/index.ts' },
      { find: /^zhuangtai\/plugins\/(.*)$/, replacement: './src/plugins/$1.ts' },
      { find: /^zhuangtai\/react$/, replacement: './src/react.ts' },
    ],
  },
  build: {
    lib: {
      entry: {
        [pkg.name]: resolve(__dirname, 'src/index.ts'),
        'plugins/immer': resolve(__dirname, 'src/plugins/immer.ts'),
        'plugins/persist': resolve(__dirname, 'src/plugins/persist.ts'),
        'plugins/history': resolve(__dirname, 'src/plugins/history.ts'),
        'react': resolve(__dirname, 'src/react.ts')
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'rxjs', 'rxjs/operators', 'immer'],
    },
  },
  plugins: [dts()],
  test: {
    name: pkg.name,
    environment: 'jsdom',
    dir: 'tests',
  }
})
