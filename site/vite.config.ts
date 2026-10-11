import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative asset paths, so the build works from any folder or sub-path.
  base: './',
  plugins: [react(), tailwindcss()],
})
