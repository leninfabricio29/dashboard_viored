import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0", // 👈 en vez de localhost
    port: 3000,
  },
  plugins: [tailwindcss(),],
})
