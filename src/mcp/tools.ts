/**
 * MCP tool registrations for qa-git.
 *
 * Tools: status · start_task · commit · push
 * Non-tech flow: autosave dirty → parent pull → match task_id → confirm / create+version.
 */

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ALLOWED_TYPES, assertTaskType, loadConfig } from '../config/load-config.js'
import {
  autosaveCommit,
  checkout,
  checkoutExisting,
  createBranch,
  currentBranch,
  fetchAll,
  findBranchesForTask,
  nextBranchName,
  parseBranchMeta,
  pullFfOnly,
  pushUpstream,
  resolveRepo,
  statusSnapshot,
} from '../git/ops.js'

function text(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  }
}

const typeSchema = z.enum(ALLOWED_TYPES)

export function registerTools(server: McpServer): void {
  server.tool(
    'qa_git_status',
    'Show current branch, dirty files, and parsed task meta for a git repo',
    {
      repoPath: z.string().describe('Absolute path to the product git repo'),
    },
    async ({ repoPath }) => {
      const cwd = resolveRepo(repoPath)
      const cfg = loadConfig(cwd)
      return text({ ok: true, ...statusSnapshot(cwd, cfg) })
    },
  )

  /**
   * Start / switch task branch.
   * - Always autosave-commits dirty work first (no ask).
   * - If matching task_id branches exist and reuseBranch/forceNew not set → needsConfirm.
   * - Base branch is always parent_default (module-base cases = dev support).
   */
  server.tool(
    'qa_git_start_task',
    'Autosave dirty → fetch → find branches for task_id → reuse or create spec|update-spec|test|update-test/{member}/{task_id}[-N]',
    {
      repoPath: z.string().describe('Absolute path to the product git repo'),
      taskId: z.string().describe('Task id, e.g. 123 or PORTAL-88'),
      type: typeSchema.describe('Phase branch type'),
      reuseBranch: z
        .string()
        .optional()
        .describe('Full short branch name to reuse after confirm (e.g. spec/vutv/123)'),
      forceNew: z
        .boolean()
        .optional()
        .describe('Create a new versioned branch even if matches exist'),
    },
    async ({ repoPath, taskId, type, reuseBranch, forceNew }) => {
      const cwd = resolveRepo(repoPath)
      const cfg = loadConfig(cwd)
      const taskType = assertTaskType(type, cfg)
      const id = taskId.trim()
      if (!id) throw new Error('taskId is required')

      const autosaveMsg = `wip ${taskType} ${id} autosave before switch`
      const autosaved = autosaveCommit(cwd, autosaveMsg)

      fetchAll(cwd, cfg.remote)
      const candidates = findBranchesForTask(cwd, cfg.remote, id)

      if (reuseBranch) {
        checkoutExisting(cwd, cfg.remote, reuseBranch)
        return text({
          ok: true,
          action: 'reuse',
          branch: currentBranch(cwd),
          autosaved,
          candidates,
        })
      }

      if (candidates.length > 0 && !forceNew) {
        return text({
          ok: true,
          needsConfirm: true,
          message:
            'Found existing branches with this task_id. Ask member to pick one to reuse, or create new (forceNew).',
          taskId: id,
          type: taskType,
          member_name: cfg.member_name,
          candidates: candidates.map((c) => ({
            branch: c.short,
            local: c.local,
            remoteRef: c.local ? null : c.full,
          })),
          howToReuse: 'Call qa_git_start_task again with reuseBranch="<branch>"',
          howToCreateNew: 'Call qa_git_start_task again with forceNew=true',
          autosaved,
          currentBranch: currentBranch(cwd),
        })
      }

      // Create from parent_default
      checkout(cwd, cfg.parent_default)
      pullFfOnly(cwd, cfg.remote, cfg.parent_default)
      const name = nextBranchName(cwd, cfg, taskType, id)
      createBranch(cwd, name)

      return text({
        ok: true,
        action: 'created',
        branch: name,
        parent: cfg.parent_default,
        autosaved,
        candidates,
      })
    },
  )

  server.tool(
    'qa_git_commit',
    'Stage all and commit. Message defaults to "{type} {task_id}" (+ optional summary). Always includes task id from branch when possible.',
    {
      repoPath: z.string(),
      summary: z
        .string()
        .optional()
        .describe('Optional short change summary appended to the message'),
      message: z
        .string()
        .optional()
        .describe('Full commit message override (task id still prepended if missing)'),
    },
    async ({ repoPath, summary, message }) => {
      const cwd = resolveRepo(repoPath)
      const cfg = loadConfig(cwd)
      const branch = currentBranch(cwd)
      const meta = parseBranchMeta(branch)

      let msg = message?.trim() || ''
      if (!msg) {
        const phase = meta.type ?? 'task'
        const tid = meta.taskId ?? 'unknown'
        msg = summary?.trim() ? `${phase} ${tid} ${summary.trim()}` : `${phase} ${tid}`
      } else if (meta.taskId && !msg.includes(meta.taskId)) {
        msg = `${meta.type ?? 'task'} ${meta.taskId} ${msg}`
      }

      const hash = autosaveCommit(cwd, msg)
      if (!hash) {
        return text({ ok: true, committed: false, reason: 'nothing to commit', branch })
      }
      return text({ ok: true, committed: true, hash, message: msg, branch })
    },
  )

  server.tool(
    'qa_git_push',
    'Push current branch to configured remote (default origin) with -u',
    {
      repoPath: z.string(),
    },
    async ({ repoPath }) => {
      const cwd = resolveRepo(repoPath)
      const cfg = loadConfig(cwd)
      const branch = currentBranch(cwd)
      if (!branch) throw new Error('Detached HEAD — checkout a branch first')
      const out = pushUpstream(cwd, cfg.remote, branch)
      return text({ ok: true, remote: cfg.remote, branch, output: out })
    },
  )

  server.tool(
    'qa_git_list_task_branches',
    'List local + remote branches that share a task_id (for confirm UI)',
    {
      repoPath: z.string(),
      taskId: z.string(),
    },
    async ({ repoPath, taskId }) => {
      const cwd = resolveRepo(repoPath)
      const cfg = loadConfig(cwd)
      fetchAll(cwd, cfg.remote)
      const candidates = findBranchesForTask(cwd, cfg.remote, taskId.trim())
      return text({
        ok: true,
        taskId: taskId.trim(),
        candidates: candidates.map((c) => ({
          branch: c.short,
          local: c.local,
          full: c.full,
        })),
      })
    },
  )
}
