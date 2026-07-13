/**
 * opencode: ~/.config/opencode/opencode.json(c) under mcp.qa-git
 */

import { existsSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildQaGitMcpEntry } from '../cursor-mcp.js'
import { readJsonObject, writeJsonFile } from './shared.js'
import type { AgentTarget, AgentWrite, FileAction } from './types.js'

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME
  return xdg && xdg.length > 0
    ? path.join(xdg, 'opencode')
    : path.join(os.homedir(), '.config', 'opencode')
}

function resolveConfigPath(): string {
  const dir = configDir()
  const jsonc = path.join(dir, 'opencode.jsonc')
  const json = path.join(dir, 'opencode.json')
  if (existsSync(json)) return json
  if (existsSync(jsonc)) return jsonc
  return jsonc
}

function stripJsonc(raw: string): string {
  // Minimal strip for // and /* */ so JSON.parse works on typical configs.
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function readOpenCodeDoc(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return { $schema: 'https://opencode.ai/config.json' }
  try {
    const raw = readFileSync(filePath, 'utf8')
    const doc = JSON.parse(stripJsonc(raw)) as unknown
    return doc && typeof doc === 'object' && !Array.isArray(doc)
      ? (doc as Record<string, unknown>)
      : { $schema: 'https://opencode.ai/config.json' }
  } catch {
    return readJsonObject(filePath)
  }
}

function mergeOpenCode(filePath: string, entry: { command: string; args: string[] }): FileAction {
  const doc = readOpenCodeDoc(filePath)
  const mcp =
    doc.mcp && typeof doc.mcp === 'object' && !Array.isArray(doc.mcp)
      ? ({ ...(doc.mcp as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  const had = Boolean(mcp['qa-git'])
  mcp['qa-git'] = {
    type: 'local',
    command: [entry.command, ...entry.args],
    enabled: true,
  }
  doc.mcp = mcp
  if (!doc.$schema) doc.$schema = 'https://opencode.ai/config.json'
  writeJsonFile(filePath, doc)
  return had ? 'updated' : 'created'
}

export const opencodeTarget: AgentTarget = {
  id: 'opencode',
  displayName: 'opencode',
  supported: true,

  detect() {
    const configPath = resolveConfigPath()
    const installed = existsSync(configDir()) || existsSync(configPath)
    const doc = readOpenCodeDoc(configPath)
    const mcp = doc.mcp as Record<string, unknown> | undefined
    return {
      installed,
      alreadyConfigured: Boolean(mcp?.['qa-git']),
      configPath,
    }
  },

  install(opts) {
    const mcpFile = resolveConfigPath()
    const entry = buildQaGitMcpEntry({ useWsl: opts.useWsl })
    const writes: AgentWrite[] = [
      { path: mcpFile, action: mergeOpenCode(mcpFile, entry), kind: 'mcp' },
    ]
    return writes
  },
}
