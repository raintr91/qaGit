import os from 'node:os'
import path from 'node:path'
import { createMcpServersTarget } from './json-mcp.js'

export const cursorTarget = createMcpServersTarget({
  id: 'cursor',
  displayName: 'Cursor',
  mcpPath: () => path.join(os.homedir(), '.cursor', 'mcp.json'),
  detectPaths: () => [path.join(os.homedir(), '.cursor')],
  skillPath: () => path.join(os.homedir(), '.cursor', 'skills', 'qa-task', 'SKILL.md'),
})
