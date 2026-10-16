import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"

const sourceDir = new URL("../src/public/templates/", import.meta.url)
const targetDir = new URL("../public/templates/", import.meta.url)

mkdirSync(targetDir, { recursive: true })

for (const fileName of readdirSync(targetDir)) {
  rmSync(join(targetDir.pathname, fileName), { recursive: true, force: true })
}

if (!existsSync(sourceDir)) {
  console.warn(`Template source directory not found: ${sourceDir.pathname}`)
  process.exit(0)
}

for (const fileName of readdirSync(sourceDir)) {
  cpSync(join(sourceDir.pathname, fileName), join(targetDir.pathname, fileName))
}

console.log(`Synced templates from ${sourceDir.pathname} to ${targetDir.pathname}`)
