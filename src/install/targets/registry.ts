/**
 * Resolve --target=… | auto | all | none + @clack/prompts multiselect (codegraph UX).
 */

import * as clack from '@clack/prompts'
import { antigravityTarget } from './antigravity.js'
import { claudeTarget } from './claude.js'
import { codexTarget } from './codex.js'
import { cursorTarget } from './cursor.js'
import { geminiTarget } from './gemini.js'
import { hermesTarget } from './hermes.js'
import { kiloTarget } from './kilo.js'
import { kiroTarget } from './kiro.js'
import { opencodeTarget } from './opencode.js'
import type { AgentId, AgentTarget } from './types.js'
import { AGENT_IDS } from './types.js'

/** Order matches codegraph, then kilo (not supported). */
export const TARGETS: AgentTarget[] = [
  claudeTarget,
  cursorTarget,
  codexTarget,
  opencodeTarget,
  hermesTarget,
  geminiTarget,
  antigravityTarget,
  kiroTarget,
  kiloTarget,
]

export function getTarget(id: AgentId): AgentTarget {
  const t = TARGETS.find((x) => x.id === id)
  if (!t) throw new Error(`Unknown agent target: ${id}`)
  return t
}

export function detectInstalled(repoPath: string): AgentId[] {
  return TARGETS.filter((t) => t.supported && t.detect(repoPath).installed).map((t) => t.id)
}

export function parseTargetFlag(
  raw: string | undefined,
  repoPath: string,
): AgentId[] | 'prompt' {
  if (raw === undefined || raw === '') return 'prompt'
  const v = raw.trim().toLowerCase()
  if (v === 'prompt') return 'prompt'
  if (v === 'none') return []
  if (v === 'all') return TARGETS.filter((t) => t.supported).map((t) => t.id)
  if (v === 'auto') {
    const detected = detectInstalled(repoPath)
    return detected.length > 0 ? detected : ['cursor']
  }
  const parts = v.split(/[,\s]+/).filter(Boolean)
  const unknown = parts.filter((p) => !AGENT_IDS.includes(p as AgentId))
  if (unknown.length) {
    throw new Error(
      `Unknown --target id(s): ${unknown.join(', ')}. Known: ${AGENT_IDS.join(', ')}, plus auto|all|none`,
    )
  }
  const ids = [...new Set(parts as AgentId[])]
  for (const id of ids) {
    if (!getTarget(id).supported) {
      throw new Error(`Agent "${id}" is not supported yet`)
    }
  }
  return ids
}

/** Keyboard multiselect like codegraph (↑↓ space enter). */
export async function promptTargets(repoPath: string): Promise<AgentId[]> {
  const detected = TARGETS.map((t) => ({
    target: t,
    detection: t.detect(repoPath),
  }))

  const initialValues = detected
    .filter(({ target, detection }) => target.supported && detection.installed)
    .map(({ target }) => target.id)

  const initial =
    initialValues.length > 0 ? initialValues : (['cursor'] as AgentId[])

  const choice = await clack.multiselect({
    message: 'Which agents should qa-git configure?',
    options: TARGETS.map((t) => {
      const det = detected.find((d) => d.target.id === t.id)!.detection
      if (!t.supported) {
        return {
          value: t.id,
          label: `${t.displayName} (not supported)`,
          hint: 'coming later',
          disabled: true,
        }
      }
      const flag = det.installed ? '(detected)' : '(not found)'
      const cfg = det.alreadyConfigured ? ' · configured' : ''
      return {
        value: t.id,
        label: `${t.displayName} ${flag}${cfg}`,
      }
    }),
    initialValues: initial,
    required: false,
  })

  if (clack.isCancel(choice)) {
    clack.cancel('Init cancelled.')
    process.exit(0)
  }

  return (choice as AgentId[]).filter((id) => getTarget(id).supported)
}

export async function resolveTargets(opts: {
  targetFlag?: string
  yes?: boolean
  repoPath: string
}): Promise<AgentId[]> {
  const parsed = parseTargetFlag(opts.targetFlag, opts.repoPath)
  if (parsed !== 'prompt') return parsed
  if (opts.yes || !process.stdin.isTTY) {
    const detected = detectInstalled(opts.repoPath)
    return detected.length > 0 ? detected : ['cursor']
  }
  return promptTargets(opts.repoPath)
}
