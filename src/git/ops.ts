/**
 * Thin git wrappers — no force-push, no hard reset.
 */

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import type { QaGitConfig, TaskType } from '../config/load-config.js'

export interface GitRunOpts {
  cwd: string
  allowFail?: boolean
}

export function git(args: string[], opts: GitRunOpts): string {
  try {
    return execFileSync('git', args, {
      cwd: opts.cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (err) {
    if (opts.allowFail) return ''
    const e = err as { stderr?: Buffer | string; message?: string }
    const stderr = typeof e.stderr === 'string' ? e.stderr : e.stderr?.toString?.() ?? ''
    throw new Error(`git ${args.join(' ')} failed: ${stderr || e.message || err}`)
  }
}

export function resolveRepo(repoPath: string): string {
  const abs = path.resolve(repoPath)
  const top = git(['rev-parse', '--show-toplevel'], { cwd: abs })
  return top
}

export function currentBranch(cwd: string): string {
  return git(['branch', '--show-current'], { cwd })
}

export function isDirty(cwd: string): boolean {
  const out = git(['status', '--porcelain'], { cwd })
  return out.length > 0
}

/** Stage all + commit. Returns commit hash or null if nothing to commit. */
export function autosaveCommit(cwd: string, message: string): string | null {
  if (!isDirty(cwd)) return null
  git(['add', '-A'], { cwd })
  // nothing staged (e.g. all ignored)
  const staged = git(['diff', '--cached', '--name-only'], { cwd })
  if (!staged) return null
  git(['commit', '-m', message], { cwd })
  return git(['rev-parse', 'HEAD'], { cwd })
}

export function fetchAll(cwd: string, remote: string): void {
  git(['fetch', remote, '--prune'], { cwd })
}

export function checkout(cwd: string, ref: string): void {
  git(['checkout', ref], { cwd })
}

export function pullFfOnly(cwd: string, remote: string, branch: string): void {
  git(['pull', '--ff-only', remote, branch], { cwd })
}

export function createBranch(cwd: string, name: string): void {
  git(['checkout', '-b', name], { cwd })
}

export function pushUpstream(cwd: string, remote: string, branch: string): string {
  return git(['push', '-u', remote, branch], { cwd })
}

/** Local branches + remote-tracking (without remote/ prefix in display we keep full). */
export function listAllBranchNames(cwd: string, remote: string): string[] {
  const local = git(['branch', '--list', '--format=%(refname:short)'], { cwd })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const remoteRefs = git(['branch', '-r', '--list', '--format=%(refname:short)'], {
    cwd,
    allowFail: true,
  })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((b) => b.startsWith(`${remote}/`) && !b.endsWith('/HEAD'))

  return [...new Set([...local, ...remoteRefs])]
}

/**
 * Match branches whose path ends with /{taskId} or /{taskId}-{n}
 * e.g. spec/vutv/123, origin/test/vutv/123-2
 */
export function findBranchesForTask(
  cwd: string,
  remote: string,
  taskId: string,
): { full: string; short: string; local: boolean }[] {
  const escaped = taskId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`/(?:${escaped})(?:-(\\d+))?$`)
  const names = listAllBranchNames(cwd, remote)
  const out: { full: string; short: string; local: boolean }[] = []

  for (const full of names) {
    const short = full.startsWith(`${remote}/`) ? full.slice(remote.length + 1) : full
    if (!re.test(short) && !re.test(full)) continue
    // Prefer matching on short name
    if (!re.test(short)) continue
    out.push({
      full,
      short,
      local: !full.startsWith(`${remote}/`),
    })
  }

  // Dedupe by short name (prefer local entry)
  const byShort = new Map<string, { full: string; short: string; local: boolean }>()
  for (const b of out) {
    const prev = byShort.get(b.short)
    if (!prev || (!prev.local && b.local)) byShort.set(b.short, b)
  }
  return [...byShort.values()].sort((a, b) => a.short.localeCompare(b.short))
}

/** Build base name type/member/taskId ; add -N if that exact branch already exists. */
export function nextBranchName(
  cwd: string,
  cfg: QaGitConfig,
  type: TaskType,
  taskId: string,
): string {
  const base = `${type}/${cfg.member_name}/${taskId}`
  const all = listAllBranchNames(cwd, cfg.remote).map((f) =>
    f.startsWith(`${cfg.remote}/`) ? f.slice(cfg.remote.length + 1) : f,
  )
  const taken = new Set(all)

  if (!taken.has(base)) return base

  let n = 1
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export function parseBranchMeta(branch: string): {
  type?: string
  member?: string
  taskId?: string
  version?: number
} {
  // type/member/taskId or type/member/taskId-N
  const m = branch.match(
    /^(spec|update-spec|test|update-test)\/([^/]+)\/([^/]+?)(?:-(\d+))?$/,
  )
  if (!m) return {}
  return {
    type: m[1],
    member: m[2],
    taskId: m[3],
    version: m[4] ? Number(m[4]) : undefined,
  }
}

export function statusSnapshot(cwd: string, cfg: QaGitConfig) {
  const branch = currentBranch(cwd)
  const dirty = isDirty(cwd)
  const porcelain = dirty ? git(['status', '--porcelain'], { cwd }) : ''
  const meta = parseBranchMeta(branch)
  return {
    repo: cwd,
    branch,
    dirty,
    dirtyFiles: porcelain
      ? porcelain.split('\n').filter(Boolean)
      : [],
    remote: cfg.remote,
    parent_default: cfg.parent_default,
    member_name: cfg.member_name,
    task: meta,
  }
}

/** Checkout existing local or remote-tracking branch. */
export function checkoutExisting(cwd: string, remote: string, shortName: string): void {
  const localExists = git(['branch', '--list', shortName], { cwd })
  if (localExists) {
    checkout(cwd, shortName)
    return
  }
  const remoteRef = `${remote}/${shortName}`
  const remoteExists = git(['branch', '-r', '--list', remoteRef], { cwd })
  if (remoteExists) {
    git(['checkout', '-b', shortName, '--track', remoteRef], { cwd })
    return
  }
  throw new Error(`Branch not found local or on ${remote}: ${shortName}`)
}
