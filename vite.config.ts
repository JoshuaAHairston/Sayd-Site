import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  // imagetools makes resized copies of photos at build time (e.g. the small year-card thumbnails)
  plugins: [
    react(),
    tailwindcss(),
    imagetools({
      // the default only matches lowercase extensions, and phone/camera exports are often .JPEG / .JPG
      include: /\.(avif|gif|heif|jpe?g|png|tiff|webp)\?.*$/i,
    }),
  ],
})
