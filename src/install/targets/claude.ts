import os from 'node:os'
import path from 'node:path'
import { createMcpServersTarget } from './json-mcp.js'

export const claudeTarget = createMcpServersTarget({
  id: 'claude',
  displayName: 'Claude Code',
  mcpPath: () => path.join(os.homedir(), '.claude.json'),
  detectPaths: () => [
    path.join(os.homedir(), '.claude'),
    path.join(os.homedir(), '.claude.json'),
  ],
  skillPath: () => path.join(os.homedir(), '.claude', 'skills', 'qa-task', 'SKILL.md'),
})
