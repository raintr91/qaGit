/**
 * Init product repo: `.qa-git.yml` + wire selected agents (cursor / claude / kilo).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { packageRoot } from '../config/load-config.js'
import { getTarget, resolveTargets } from './targets/registry.js'
import type { AgentId, AgentWrite, FileAction } from './targets/types.js'

export interface InitOptions {
  repoPath?: string
  force?: boolean
  skipSkill?: boolean
  useWsl?: boolean
  mcpFile?: string
  /** --target=cursor,claude,kilo | auto | all | none */
  target?: string
  /** Non-interactive: default target=auto when target omitted */
  yes?: boolean
}

export interface InitResult {
  configPath: string
  configAction: FileAction
  targets: AgentId[]
  writes: AgentWrite[]
}

function exampleYmlPath(): string {
  return path.join(packageRoot(), 'qa-git.example.yml')
}

function writeConfig(repoPath: string, force: boolean): { path: string; action: FileAction } {
  const example = exampleYmlPath()
  if (!existsSync(example)) {
    throw new Error(`qa-git: missing example config at ${example}`)
  }
  const configPath = path.join(repoPath, '.qa-git.yml')
  const contents = readFileSync(example, 'utf8')
  const exists = existsSync(configPath)
  if (exists && !force) {
    return { path: configPath, action: 'skipped' }
  }
  mkdirSync(path.dirname(configPath), { recursive: true })
  writeFileSync(configPath, contents, 'utf8')
  return { path: configPath, action: exists ? 'updated' : 'created' }
}

/** Sync `.qa-git.yml` + MCP/skill for selected agents. */
export async function initRepo(opts: InitOptions = {}): Promise<InitResult> {
  const repoPath = path.resolve(opts.repoPath ?? process.cwd())
  const force = opts.force === true

  const { path: configPath, action: configAction } = writeConfig(repoPath, force)

  const targets = await resolveTargets({
    targetFlag: opts.target,
    yes: opts.yes,
    repoPath,
  })

  const writes: AgentWrite[] = []
  for (const id of targets) {
    const agent = getTarget(id)
    writes.push(
      ...agent.install({
        repoPath,
        force,
        skipSkill: opts.skipSkill,
        useWsl: opts.useWsl,
        mcpFile: opts.mcpFile,
      }),
    )
  }

  return { configPath, configAction, targets, writes }
}

/** Install MCP/skill only (no .qa-git.yml). */
export async function installAgents(opts: InitOptions = {}): Promise<{
  targets: AgentId[]
  writes: AgentWrite[]
}> {
  const repoPath = path.resolve(opts.repoPath ?? process.cwd())
  const targets = await resolveTargets({
    targetFlag: opts.target,
    yes: opts.yes ?? true,
    repoPath,
  })
  const writes: AgentWrite[] = []
  for (const id of targets) {
    writes.push(
      ...getTarget(id).install({
        repoPath,
        force: opts.force === true,
        skipSkill: opts.skipSkill,
        useWsl: opts.useWsl,
        mcpFile: opts.mcpFile,
      }),
    )
  }
  return { targets, writes }
}
