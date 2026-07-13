/** Re-exports for library consumers / tests. */
export { createServer, main as startMcp } from './mcp/server.js'
export { initRepo, installAgents } from './install/init.js'
export { installCursorMcp, buildQaGitMcpEntry } from './install/cursor-mcp.js'
export { TARGETS, resolveTargets, parseTargetFlag } from './install/targets/registry.js'
export { AGENT_IDS } from './install/targets/types.js'
export type { AgentId } from './install/targets/types.js'
export { loadConfig, ALLOWED_TYPES } from './config/load-config.js'
