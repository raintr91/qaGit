/**
 * Factory for agents that use standard `{ mcpServers: { qa-git: { command, args } } }`.
 */

import { existsSync } from 'node:fs'
import { buildQaGitMcpEntry } from '../cursor-mcp.js'
import { copySkillIfNeeded, mergeMcpServers, readJsonObject } from './shared.js'
import type { AgentId, AgentTarget, AgentWrite } from './types.js'

export function createMcpServersTarget(opts: {
  id: AgentId
  displayName: string
  /** Global MCP config file. */
  mcpPath: () => string
  /** Dirs/files that mean the agent is installed. */
  detectPaths: () => string[]
  /** Optional skill destination. */
  skillPath?: () => string
  /** Optional transform of the stdio entry (e.g. drop fields). */
  mapEntry?: (entry: { command: string; args: string[] }) => Record<string, unknown>
}): AgentTarget {
  return {
    id: opts.id,
    displayName: opts.displayName,
    supported: true,

    detect() {
      const configPath = opts.mcpPath()
      const installed =
        opts.detectPaths().some((p) => existsSync(p)) || existsSync(configPath)
      const doc = readJsonObject(configPath)
      const servers = doc.mcpServers as Record<string, unknown> | undefined
      return {
        installed,
        alreadyConfigured: Boolean(servers?.['qa-git']),
        configPath,
      }
    },

    install(installOpts) {
      const mcpFile =
        installOpts.mcpFile && opts.id === 'cursor' ? installOpts.mcpFile : opts.mcpPath()
      const base = buildQaGitMcpEntry({ useWsl: installOpts.useWsl })
      const entry = opts.mapEntry ? opts.mapEntry(base) : base
      const writes: AgentWrite[] = [
        { path: mcpFile, action: mergeMcpServers(mcpFile, entry), kind: 'mcp' },
      ]
      if (!installOpts.skipSkill && opts.skillPath) {
        const skillPath = opts.skillPath()
        writes.push({
          path: skillPath,
          action: copySkillIfNeeded(skillPath, installOpts.force === true),
          kind: 'skill',
        })
      }
      return writes
    },
  }
}

