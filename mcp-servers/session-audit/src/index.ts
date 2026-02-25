#!/usr/bin/env node
/**
 * Session Audit MCP Server
 *
 * Provides automatic session auditing, logging, and context retrieval
 * for Claude Code sessions.
 *
 * This MCP server tracks:
 * - Session start/end times
 * - Actions taken (tool calls, file operations)
 * - Decisions made with rationale
 * - Task state changes
 * - Incomplete work for handoff
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool modules
import {
  captureTools,
  handleCaptureTool,
  isCaptureToolName,
} from './tools/capture.js';
import {
  queryTools,
  handleQueryTool,
  isQueryToolName,
} from './tools/query.js';
import {
  sessionTools,
  handleSessionTool,
  isSessionToolName,
} from './tools/session.js';

// Import database for initialization
import { getDatabase, closeDatabase } from './database.js';

// Server metadata
const SERVER_NAME = 'session-audit';
const SERVER_VERSION = '1.0.0';

/**
 * Core server tools (ping, etc.)
 */
const coreTools: Tool[] = [
  {
    name: 'ping',
    description: 'Test if the session audit MCP server is running',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

/**
 * All available tools
 */
const TOOLS: Tool[] = [...coreTools, ...captureTools, ...queryTools, ...sessionTools];

/**
 * Handle core tool calls
 */
function handleCoreTool(
  name: string,
  _args: Record<string, unknown>
): { success: boolean; data?: unknown; error?: string } {
  switch (name) {
    case 'ping':
      return {
        success: true,
        data: {
          message: 'Session Audit MCP Server is running',
          version: SERVER_VERSION,
          timestamp: new Date().toISOString(),
          toolCount: TOOLS.length,
        },
      };

    default:
      return {
        success: false,
        error: `Unknown core tool: ${name}`,
      };
  }
}

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args || {}) as Record<string, unknown>;

    let result: { success: boolean; data?: unknown; error?: string };

    // Route to appropriate handler
    if (name === 'ping') {
      result = handleCoreTool(name, toolArgs);
    } else if (isCaptureToolName(name)) {
      result = handleCaptureTool(name, toolArgs);
    } else if (isQueryToolName(name)) {
      result = handleQueryTool(name, toolArgs);
    } else if (isSessionToolName(name)) {
      result = handleSessionTool(name, toolArgs);
    } else {
      result = {
        success: false,
        error: `Unknown tool: ${name}`,
      };
    }

    // Format response
    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: result.error }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Initialize database
  try {
    getDatabase();
    console.error('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.error('Shutting down...');
    closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('Shutting down...');
    closeDatabase();
    process.exit(0);
  });

  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
  console.error(`Available tools: ${TOOLS.map((t) => t.name).join(', ')}`);
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  closeDatabase();
  process.exit(1);
});
