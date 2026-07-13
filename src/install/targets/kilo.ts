/**
 * Kilo — listed in the agent picker but not supported yet (disabled).
 */

import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { AgentTarget } from './types.js'

export const kiloTarget: AgentTarget = {
  id: 'kilo',
  displayName: 'Kilo',
  supported: false,

  detect(repoPath) {
    const configPath = path.join(repoPath, '.kilocode', 'mcp.json')
    const installed =
      existsSync(path.join(os.homedir(), '.kilocode')) ||
      existsSync(path.join(os.homedir(), '.config', 'kilo')) ||
      existsSync(path.join(repoPath, '.kilocode'))
    return { installed, alreadyConfigured: false, configPath }
  },

  install() {
    throw new Error('qa-git: Kilo is not supported yet')
  },
}
