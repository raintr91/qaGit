/**
 * CLI twin for qa-git (install / version / status helpers).
 */

import { installCursorMcp } from './install/cursor-mcp.js'
import { loadConfig } from './config/load-config.js'
import { resolveRepo, statusSnapshot } from './git/ops.js'

const VERSION = '0.1.0'

function usage(): never {
  console.log(`qa-git ${VERSION}

Usage:
  qa-git version
  qa-git install --target=cursor [--yes] [--wsl] [--mcp-file <path>]
  qa-git status [repoPath]

Env:
  QA_GIT_MCP_WSL=1   force wsl.exe wrapper in mcp.json
`)
  process.exit(1)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const cmd = args[0]
  if (!cmd || cmd === '-h' || cmd === '--help') usage()

  if (cmd === 'version') {
    console.log(VERSION)
    return
  }

  if (cmd === 'install') {
    const target = args.find((a) => a.startsWith('--target='))?.split('=')[1] ?? 'cursor'
    if (target !== 'cursor') {
      throw new Error(`Unknown target: ${target}`)
    }
    const useWsl = args.includes('--wsl')
    const mcpFileArg = args.findIndex((a) => a === '--mcp-file')
    const mcpFile = mcpFileArg >= 0 ? args[mcpFileArg + 1] : undefined
    const written = installCursorMcp({ useWsl, mcpFile, yes: args.includes('--yes') })
    console.log(`Wrote qa-git MCP entry → ${written}`)
    return
  }

  if (cmd === 'status') {
    const repoPath = args[1] ?? process.cwd()
    const cwd = resolveRepo(repoPath)
    const cfg = loadConfig(cwd)
    console.log(JSON.stringify(statusSnapshot(cwd, cfg), null, 2))
    return
  }

  usage()
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
