import os from 'node:os'
import path from 'node:path'
import { createMcpServersTarget } from './json-mcp.js'

export const kiroTarget = createMcpServersTarget({
  id: 'kiro',
  displayName: 'Kiro',
  mcpPath: () => path.join(os.homedir(), '.kiro', 'settings', 'mcp.json'),
  detectPaths: () => [path.join(os.homedir(), '.kiro')],
})
