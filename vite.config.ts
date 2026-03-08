import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/agent': path.resolve(__dirname, './agent-service/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
