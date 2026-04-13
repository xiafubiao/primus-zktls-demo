import { defineConfig } from 'vite'
export default defineConfig({
  optimizeDeps: {
    include: ['@primuslabs/zktls-js-sdk'],
  },
  define: {
    global: 'globalThis',
  },
})