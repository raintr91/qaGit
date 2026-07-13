/**
 * Load qa-git config from repo `.qa-git.yml` or `~/.qa-git.yml`.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

export const ALLOWED_TYPES = ['spec', 'update-spec', 'test', 'update-test'] as const
export type TaskType = (typeof ALLOWED_TYPES)[number]

export interface QaGitConfig {
  parent_default: string
  member_name: string
  remote: string
  allowed_types: TaskType[]
}

const DEFAULTS: QaGitConfig = {
  parent_default: 'main',
  member_name: 'member',
  remote: 'origin',
  allowed_types: [...ALLOWED_TYPES],
}

function parseConfigFile(filePath: string): Partial<QaGitConfig> {
  const raw = readFileSync(filePath, 'utf8')
  const doc = parseYaml(raw) as Partial<QaGitConfig> | null
  return doc && typeof doc === 'object' ? doc : {}
}

/** Resolve config: repo `.qa-git.yml` overrides `~/.qa-git.yml` overrides defaults. */
export function loadConfig(repoPath: string): QaGitConfig {
  const homeFile = path.join(os.homedir(), '.qa-git.yml')
  const repoFile = path.join(repoPath, '.qa-git.yml')

  let merged: QaGitConfig = { ...DEFAULTS, allowed_types: [...DEFAULTS.allowed_types] }

  if (existsSync(homeFile)) {
    merged = { ...merged, ...parseConfigFile(homeFile) }
  }
  if (existsSync(repoFile)) {
    merged = { ...merged, ...parseConfigFile(repoFile) }
  }

  if (!merged.member_name?.trim()) {
    throw new Error('qa-git: member_name missing — set in .qa-git.yml or ~/.qa-git.yml')
  }
  if (!merged.parent_default?.trim()) {
    throw new Error('qa-git: parent_default missing')
  }
  if (!merged.remote?.trim()) {
    merged.remote = 'origin'
  }
  if (!merged.allowed_types?.length) {
    merged.allowed_types = [...ALLOWED_TYPES]
  }

  return merged
}

export function assertTaskType(type: string, cfg: QaGitConfig): TaskType {
  if (!cfg.allowed_types.includes(type as TaskType)) {
    throw new Error(
      `qa-git: type "${type}" not allowed. Use: ${cfg.allowed_types.join(' | ')}`,
    )
  }
  return type as TaskType
}

/** Package root (…/qa-git), whether running from src or dist. */
export function packageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
}
