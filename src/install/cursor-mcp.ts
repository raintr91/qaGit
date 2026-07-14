/**
 * Merge qa-git into Cursor's mcp.json.
 *
 * Cursor-on-Windows + code-in-WSL:
 * - Write to %USERPROFILE%\.cursor\mcp.json (via /mnt/c/Users/... when running in WSL)
 * - Spawn via wsl.exe → Linux node + qa-git-mcp.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { packageRoot } from '../config/load-config.js'

export interface CursorInstallOptions {
  mcpFile?: string
  useWsl?: boolean
  yes?: boolean
}

/** When running inside WSL, prefer the Windows Cursor config Cursor actually loads. */
export function detectWindowsCursorMcpPath(): string | undefined {
  const usersRoot = '/mnt/c/Users'
  if (!existsSync(usersRoot)) return undefined
  try {
    const names = readdirSync(usersRoot).filter(
      (n) => !n.startsWith('.') && n !== 'Public' && n !== 'Default' && n !== 'All Users',
    )
    for (const name of names) {
      const candidate = path.join(usersRoot, name, '.cursor', 'mcp.json')
      const dir = path.join(usersRoot, name, '.cursor')
      if (existsSync(candidate) || existsSync(dir)) return candidate
    }
  } catch {
    /* ignore */
  }
  return undefined
}

export function defaultCursorMcpPath(): string {
  const win = detectWindowsCursorMcpPath()
  if (win) return win
  return path.join(os.homedir(), '.cursor', 'mcp.json')
}

export function buildQaGitMcpEntry(opts: { useWsl?: boolean } = {}): {
  type?: string
  command: string
  args: string[]
} {
  const root = packageRoot()
  const mcpJs = path.join(root, 'bin', 'qa-git-mcp.mjs')
  const nodeBin = process.execPath
  const winMcp = detectWindowsCursorMcpPath()
  const forceWsl =
    opts.useWsl ||
    process.env.QA_GIT_MCP_WSL === '1' ||
    Boolean(process.env.WSL_DISTRO_NAME && winMcp)

  if (forceWsl) {
    return {
      type: 'stdio',
      command: 'wsl.exe',
      // Absolute node path — avoid interactive nvm under Cursor spawn
      args: ['-e', 'bash', '-lc', `exec '${nodeBin}' '${mcpJs}'`],
    }
  }

  return {
    type: 'stdio',
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
