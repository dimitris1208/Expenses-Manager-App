import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    base: '/',
  }

  // THIS BLOCK IS CRITICAL FOR GITHUB PAGES
  if (command !== 'serve') {
    config.base = '/Expenses-Manager-App/'
  }

  return config
})