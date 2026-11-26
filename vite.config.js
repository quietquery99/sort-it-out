import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

// react() builds the website; cloudflare() runs our Worker (backend) alongside it.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'guide-preview' ? [react()] : [react(), cloudflare()],
}))
