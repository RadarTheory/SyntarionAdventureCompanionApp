import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const r = (path) => fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: 'react/jsx-dev-runtime', replacement: r('./node_modules/react/jsx-dev-runtime.js') },
      { find: 'react/jsx-runtime', replacement: r('./node_modules/react/jsx-runtime.js') },
      { find: 'react-dom/client', replacement: r('./node_modules/react-dom/client.js') },
      { find: 'react-dom', replacement: r('./node_modules/react-dom/index.js') },
      { find: 'react', replacement: r('./node_modules/react/index.js') },
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-dev-runtime', 'react/jsx-runtime', 'react-dom/client'],
  },
})
