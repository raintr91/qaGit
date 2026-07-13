/**
 * Codex CLI: ~/.codex/config.toml → [mcp_servers.qa-git]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildQaGitMcpEntry } from '../cursor-mcp.js'
import type { AgentTarget, AgentWrite, FileAction } from './types.js'

const HEADER = '[mcp_servers.qa-git]'

function configDir(): string {
  return path.join(os.homedir(), '.codex')
}

function tomlPath(): string {
  return path.join(configDir(), 'config.toml')
}

function upsertTomlBlock(filePath: string, command: string, args: string[]): FileAction {
  const block = [
    HEADER,
    `command = ${JSON.stringify(command)}`,
    `args = [${args.map((a) => JSON.stringify(a)).join(', ')}]`,
    '',
  ].join('\n')

  mkdirSync(path.dirname(filePath), { recursive: true })
  const exists = existsSync(filePath)
  const prev = exists ? readFileSync(filePath, 'utf8') : ''

  if (prev.includes(HEADER)) {
    const re = /\[mcp_servers\.qa-git\][\s\S]*?(?=\n\[|$)/
    const next = prev.replace(re, block.trimEnd() + '\n')
    if (next === prev) return 'unchanged'
    writeFileSync(filePath, next, 'utf8')
    return 'updated'
  }

  const sep = prev.length === 0 || prev.endsWith('\n') ? '' : '\n'
  writeFileSync(filePath, `${prev}${sep}\n${block}`, 'utf8')
  return exists ? 'updated' : 'created'
}

export const codexTarget: AgentTarget = {
  id: 'codex',
  displayName: 'Codex CLI',
  supported: true,

  detect() {
    const configPath = tomlPath()
    const installed = existsSync(configDir()) || existsSync(configPath)
    const alreadyConfigured =
      existsSync(configPath) && readFileSync(configPath, 'utf8').includes(HEADER)
    return { installed, alreadyConfigured, configPath }
  },

  install(opts) {
    const entry = buildQaGitMcpEntry({ useWsl: opts.useWsl })
    const mcpFile = tomlPath()
    const writes: AgentWrite[] = [
      {
        path: mcpFile,
        action: upsertTomlBlock(mcpFile, entry.command, entry.args),
        kind: 'mcp',
      },
    ]
    return writes
  },
}
