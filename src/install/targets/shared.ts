/**
 * Shared helpers for agent target writers.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { packageRoot } from '../../config/load-config.js'
import type { FileAction } from './types.js'

export function skillSourcePath(): string {
  return path.join(packageRoot(), 'examples', 'cursor', 'SKILL.md')
}

export function writeJsonFile(filePath: string, doc: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
}

export function readJsonObject(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {}
  try {
    const doc = JSON.parse(readFileSync(filePath, 'utf8')) as unknown
    return doc && typeof doc === 'object' && !Array.isArray(doc)
      ? (doc as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function copySkillIfNeeded(dest: string, force: boolean): FileAction {
  const src = skillSourcePath()
  if (!existsSync(src)) {
    throw new Error(`qa-git: missing skill at ${src}`)
  }
  const exists = existsSync(dest)
  if (exists && !force) return 'skipped'
  mkdirSync(path.dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  return exists ? 'updated' : 'created'
}

/** Always upsert qa-git under mcpServers. */
export function mergeMcpServers(
  filePath: string,
  entry: Record<string, unknown>,
): FileAction {
  const doc = readJsonObject(filePath)
  const servers =
    doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers)
      ? ({ ...(doc.mcpServers as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const had = Boolean(servers['qa-git'])
  servers['qa-git'] = entry
  doc.mcpServers = servers
  writeJsonFile(filePath, doc)
  return had ? 'updated' : 'created'
}

export function homeExists(...parts: string[]): boolean {
  return existsSync(path.join(...parts))
}
