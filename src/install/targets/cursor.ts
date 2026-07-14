import os from 'node:os'
import path from 'node:path'
import { createMcpServersTarget } from './json-mcp.js'
import { defaultCursorMcpPath, detectWindowsCursorMcpPath } from '../cursor-mcp.js'

export const cursorTarget = createMcpServersTarget({
  id: 'cursor',
  displayName: 'Cursor',
  // Win Cursor reads %USERPROFILE%\.cursor\mcp.json — not WSL ~/.cursor
  mcpPath: () => defaultCursorMcpPath(),
  detectPaths: () => {
    const paths = [path.join(os.homedir(), '.cursor')]
    const win = detectWindowsCursorMcpPath()
    if (win) paths.push(path.dirname(win))
    return paths
  },
  skillPath: () => {
    const win = detectWindowsCursorMcpPath()
    if (win) return path.join(path.dirname(win), 'skills', 'qa-task', 'SKILL.md')
    return path.join(os.homedir(), '.cursor', 'skills', 'qa-task', 'SKILL.md')
  },
})
