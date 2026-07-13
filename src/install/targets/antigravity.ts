import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createMcpServersTarget } from './json-mcp.js'

function antigravityMcpPath(): string {
  const unified = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json')
  const legacy = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json')
  if (existsSync(path.join(os.homedir(), '.gemini', 'config', '.migrated'))) return unified
  if (existsSync(unified)) return unified
  return legacy
}

export const antigravityTarget = createMcpServersTarget({
  id: 'antigravity',
  displayName: 'Antigravity',
  mcpPath: antigravityMcpPath,
  detectPaths: () => [
    path.join(os.homedir(), '.gemini', 'antigravity'),
    path.join(os.homedir(), '.gemini', 'config'),
  ],
  // Antigravity rejects type:stdio — we only write command/args.
  mapEntry: (entry) => ({ command: entry.command, args: entry.args }),
})
