import os from 'node:os'
import path from 'node:path'
import { createMcpServersTarget } from './json-mcp.js'

export const geminiTarget = createMcpServersTarget({
  id: 'gemini',
  displayName: 'Gemini CLI',
  mcpPath: () => path.join(os.homedir(), '.gemini', 'settings.json'),
  detectPaths: () => [path.join(os.homedir(), '.gemini')],
})
