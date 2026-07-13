/**
 * CLI twin for qa-git (install / init / version / status helpers).
 */

import * as clack from '@clack/prompts'
import { initRepo, installAgents } from './install/init.js'
import { AGENT_IDS } from './install/targets/types.js'
import { loadConfig } from './config/load-config.js'
import { resolveRepo, statusSnapshot } from './git/ops.js'

const VERSION = '0.1.0'

function usage(): never {
  console.log(`qa-git ${VERSION}

Usage:
  qa-git version
  qa-git install [--target=<ids>] [--yes] [--wsl] [--mcp-file <path>] [--force]
  qa-git init [repoPath] [--target=<ids>] [--yes] [--force] [--skip-skill] [--wsl]
  qa-git status [repoPath]

  init     Write .qa-git.yml + wire agents (MCP + skill where supported)
  install  Wire agents only

  --target  ${AGENT_IDS.join(',')} | auto | all | none
            omit → keyboard multiselect (↑↓ space enter); --yes → auto
  --yes     Non-interactive (default target=auto)

Env:
  QA_GIT_MCP_WSL=1   force wsl.exe wrapper in mcp.json
`)
  process.exit(1)
}

function flagValue(args: string[], name: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`${name}=`))
  if (eq) return eq.slice(name.length + 1)
  const idx = args.findIndex((a) => a === name)
  if (idx >= 0) return args[idx + 1]
  return undefined
}

function printWrites(
  writes: { path: string; action: string; kind: string }[],
): void {
  for (const w of writes) {
    clack.log.step(`${w.kind} ${w.action} → ${w.path}`)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const cmd = args[0]
  if (!cmd || cmd === '-h' || cmd === '--help') usage()

  if (cmd === 'version') {
    console.log(VERSION)
    return
  }

  if (cmd === 'install') {
    clack.intro('qa-git install')
    const result = await installAgents({
      target: flagValue(args, '--target'),
      yes: args.includes('--yes'),
      force: args.includes('--force'),
      skipSkill: args.includes('--skip-skill'),
      useWsl: args.includes('--wsl'),
      mcpFile: flagValue(args, '--mcp-file'),
    })
    clack.log.info(`Targets: ${result.targets.join(', ') || '(none)'}`)
    printWrites(result.writes)
    clack.outro('Restart selected agents to load qa_git_* tools.')
    return
  }

  if (cmd === 'init') {
    clack.intro('qa-git init')
    const positional = args.slice(1).find((a) => !a.startsWith('-'))
    const result = await initRepo({
      repoPath: positional,
      target: flagValue(args, '--target'),
      yes: args.includes('--yes'),
      force: args.includes('--force'),
      skipSkill: args.includes('--skip-skill'),
      useWsl: args.includes('--wsl'),
      mcpFile: flagValue(args, '--mcp-file'),
    })
    clack.log.step(`Config ${result.configAction} → ${result.configPath}`)
    clack.log.info(`Targets: ${result.targets.join(', ') || '(none)'}`)
    printWrites(result.writes)
    if (result.configAction === 'created' || result.configAction === 'updated') {
      clack.log.warn('Edit member_name in .qa-git.yml before starting tasks')
    } else if (result.configAction === 'skipped') {
      clack.log.info('Config already exists (use --force to overwrite)')
    }
    clack.outro('Restart selected agents to load qa_git_* tools.')
    return
  }

  if (cmd === 'status') {
    const repoPath = args[1] ?? process.cwd()
    const cwd = resolveRepo(repoPath)
    const cfg = loadConfig(cwd)
    console.log(JSON.stringify(statusSnapshot(cwd, cfg), null, 2))
    return
  }

  usage()
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
