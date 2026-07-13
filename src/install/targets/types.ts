/**
 * Agent target ids — same surface as codegraph, plus kilo (not supported yet).
 */

export type AgentId =
  | 'claude'
  | 'cursor'
  | 'codex'
  | 'opencode'
  | 'hermes'
  | 'gemini'
  | 'antigravity'
  | 'kiro'
  | 'kilo'

export const AGENT_IDS: AgentId[] = [
  'claude',
  'cursor',
  'codex',
  'opencode',
  'hermes',
  'gemini',
  'antigravity',
  'kiro',
  'kilo',
]

export type FileAction = 'created' | 'updated' | 'skipped' | 'unchanged'

export interface AgentWrite {
  path: string
  action: FileAction
  kind: 'mcp' | 'skill'
}

export interface AgentDetect {
  installed: boolean
  alreadyConfigured: boolean
  configPath: string
}

export interface AgentInstallOpts {
  repoPath: string
  force?: boolean
  skipSkill?: boolean
  useWsl?: boolean
  mcpFile?: string
}

export interface AgentTarget {
  id: AgentId
  displayName: string
  /** When false, shown in prompt as (not supported) and not installable. */
  supported: boolean
  detect(repoPath: string): AgentDetect
  install(opts: AgentInstallOpts): AgentWrite[]
}
