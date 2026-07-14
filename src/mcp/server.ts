/**
 * MCP server entry — stdio transport for Cursor.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerTools } from './tools.js'

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'qa-git',
    version: '0.1.0',
  })
  registerTools(server)
  return server
}

export async function main(): Promise<void> {
  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

const entry = process.argv[1] ?? ''
const isDirect = entry.includes('mcp/server') || entry.includes('qa-git-mcp')
if (isDirect) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
