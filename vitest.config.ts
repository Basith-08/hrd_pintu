import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const require = createRequire(import.meta.url)
const nuxtRequire = createRequire(require.resolve("nuxt/package.json"))

export default defineConfig({
  resolve: {
    alias: {
      "~~": fileURLToPath(new URL(".", import.meta.url)),
      // Match Nuxt's H3 under pnpm without adding another runtime dependency.
      h3: nuxtRequire.resolve("h3"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
