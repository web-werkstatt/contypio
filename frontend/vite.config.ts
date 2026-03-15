import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          tiptap: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-underline', '@tiptap/extension-link', '@tiptap/extension-placeholder'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8061,
    proxy: {
      '/api': 'http://localhost:8060',
      '/content': 'http://localhost:8060',
      '/uploads': 'http://localhost:8060',
    },
  },
})
