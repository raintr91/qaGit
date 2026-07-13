/**
 * Merge qa-git into Cursor's mcp.json (like artifactgraph install --target=cursor).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { packageRoot } from '../config/load-config.js'

export interface CursorInstallOptions {
  mcpFile?: string
  useWsl?: boolean
  yes?: boolean
}

export function defaultCursorMcpPath(): string {
  return path.join(os.homedir(), '.cursor', 'mcp.json')
}

export function buildQaGitMcpEntry(opts: { useWsl?: boolean } = {}): {
  command: string
  args: string[]
} {
  const root = packageRoot()
  const mcpJs = path.join(root, 'bin', 'qa-git-mcp.mjs')
  const nodeBin = process.execPath

  if (opts.useWsl || process.env.QA_GIT_MCP_WSL === '1') {
    return {
      command: 'wsl.exe',
      args: [
        '-e',
        'bash',
        '-lc',
        `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; exec node '${root}/bin/qa-git-mcp.mjs'`,
      ],
    }
  }

  return {
    command: nodeBin,
    args: [mcpJs],
  }
}

export function installCursorMcp(opts: CursorInstallOptions = {}): string {
  const mcpFile = opts.mcpFile ?? defaultCursorMcpPath()
  mkdirSync(path.dirname(mcpFile), { recursive: true })

  let doc: { mcpServers?: Record<string, unknown> } = {}
  if (existsSync(mcpFile)) {
    doc = JSON.parse(readFileSync(mcpFile, 'utf8')) as typeof doc
  }
  doc.mcpServers ??= {}
  doc.mcpServers['qa-git'] = buildQaGitMcpEntry({ useWsl: opts.useWsl })

  writeFileSync(mcpFile, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  return mcpFile
}
