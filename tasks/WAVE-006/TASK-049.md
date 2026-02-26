# TASK-049: MCP Server for Claude Desktop

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Create an MCP server allowing Claude Desktop to manage tasks.

## Implementation

```typescript
// packages/mcp-server/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE = process.env.TASKFLOW_API_URL || 'http://localhost:3000/api';
const API_TOKEN = process.env.TASKFLOW_API_TOKEN;

async function fetchApi(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
      ...options?.headers
    }
  });
  return res.json();
}

const server = new Server(
  {
    name: 'taskflow',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_tasks',
      description: 'List tasks with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['inbox', 'today', 'upcoming', 'overdue', 'all'],
            description: 'Filter type'
          },
          limit: { type: 'number', description: 'Max tasks to return' }
        }
      }
    },
    {
      name: 'create_task',
      description: 'Create a new task',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Task content' },
          dueDate: { type: 'string', description: 'ISO date string' },
          priority: {
            type: 'string',
            enum: ['p1', 'p2', 'p3', 'p4']
          },
          projectId: { type: 'string' }
        },
        required: ['content']
      }
    },
    {
      name: 'complete_task',
      description: 'Mark a task as complete',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID' }
        },
        required: ['taskId']
      }
    },
    {
      name: 'quick_add',
      description: 'Add task using natural language',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Natural language task, e.g., "Buy milk tomorrow at 3pm"'
          }
        },
        required: ['text']
      }
    },
    {
      name: 'search_tasks',
      description: 'Search tasks by content',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_tasks': {
      const filter = args?.filter || 'today';
      const result = await fetchApi(`/smart-lists/${filter}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.tasks, null, 2)
        }]
      };
    }

    case 'create_task': {
      const task = await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify(args)
      });
      return {
        content: [{
          type: 'text',
          text: `Created task: ${task.content} (ID: ${task.id})`
        }]
      };
    }

    case 'complete_task': {
      await fetchApi(`/tasks/${args.taskId}/complete`, { method: 'POST' });
      return {
        content: [{
          type: 'text',
          text: `Completed task ${args.taskId}`
        }]
      };
    }

    case 'quick_add': {
      const result = await fetchApi('/ai/quick-add', {
        method: 'POST',
        body: JSON.stringify({ text: args.text })
      });
      return {
        content: [{
          type: 'text',
          text: `Created task: ${result.task.content}`
        }]
      };
    }

    case 'search_tasks': {
      const tasks = await fetchApi(`/tasks/search?q=${encodeURIComponent(args.query)}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(tasks, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

## Claude Desktop Config

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "taskflow": {
      "command": "node",
      "args": ["/path/to/taskflow/packages/mcp-server/dist/index.js"],
      "env": {
        "TASKFLOW_API_URL": "https://api.taskflow.app",
        "TASKFLOW_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Acceptance Criteria

1. [ ] MCP server starts via stdio
2. [ ] List tasks tool works
3. [ ] Create task tool works
4. [ ] Complete task tool works
5. [ ] Quick add with NLP works
6. [ ] Claude Desktop integration works
