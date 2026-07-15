import { defineConfig } from '@lovable.dev/vite-tanstack-config'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true })],
})
