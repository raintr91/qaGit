/**
 * Hermes Agent: $HERMES_HOME/config.yaml (default ~/.hermes/config.yaml)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { buildQaGitMcpEntry } from '../cursor-mcp.js'
import type { AgentTarget, AgentWrite, FileAction } from './types.js'

function hermesHome(): string {
  return process.env.HERMES_HOME?.trim() || path.join(os.homedir(), '.hermes')
}

function configPath(): string {
  return path.join(hermesHome(), 'config.yaml')
}

function mergeHermes(filePath: string, entry: { command: string; args: string[] }): FileAction {
  let doc: Record<string, unknown> = {}
  const exists = existsSync(filePath)
  if (exists) {
    try {
      const parsed = parseYaml(readFileSync(filePath, 'utf8')) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        doc = parsed as Record<string, unknown>
      }
    } catch {
      doc = {}
    }
  }

  const servers =
    doc.mcp_servers && typeof doc.mcp_servers === 'object' && !Array.isArray(doc.mcp_servers)
      ? ({ ...(doc.mcp_servers as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  const had = Boolean(servers['qa-git'])
  servers['qa-git'] = {
    command: entry.command,
    args: entry.args,
  }
  doc.mcp_servers = servers

  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, stringifyYaml(doc), 'utf8')
  return had ? 'updated' : 'created'
}

export const hermesTarget: AgentTarget = {
  id: 'hermes',
  displayName: 'Hermes Agent',
  supported: true,

  detect() {
    const cfg = configPath()
    const installed = existsSync(hermesHome()) || existsSync(cfg)
    let alreadyConfigured = false
    if (existsSync(cfg)) {
      try {
        const doc = parseYaml(readFileSync(cfg, 'utf8')) as {
          mcp_servers?: Record<string, unknown>
        }
        alreadyConfigured = Boolean(doc?.mcp_servers?.['qa-git'])
      } catch {
        alreadyConfigured = false
      }
    }
    return { installed, alreadyConfigured, configPath: cfg }
  },

  install(opts) {
    const entry = buildQaGitMcpEntry({ useWsl: opts.useWsl })
    const mcpFile = configPath()
    const writes: AgentWrite[] = [
      { path: mcpFile, action: mergeHermes(mcpFile, entry), kind: 'mcp' },
    ]
    return writes
  },
}
