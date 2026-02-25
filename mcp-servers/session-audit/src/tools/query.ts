/**
 * Session Audit MCP Server - Query Tools
 *
 * Tools for searching and querying the audit database.
 * These are the "read" tools for retrieving session history.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  searchActions,
  searchDecisions,
  getUnresolvedIncompleteWork,
  getDatabase,
  getTaskHistory,
  getFileHistory,
} from '../database.js';
import type { ActionType, IncompleteWork } from '../types.js';

/**
 * Tool definitions for query operations
 */
export const queryTools: Tool[] = [
  {
    name: 'search_actions',
    description:
      'Search action history with filters (tool calls, file operations, commands, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for in action descriptions, tools, or file paths',
        },
        type: {
          type: 'string',
          enum: [
            'tool_call',
            'file_read',
            'file_write',
            'file_edit',
            'command',
            'search',
            'decision',
            'task_change',
            'error',
            'other',
          ],
          description: 'Filter by action type',
        },
        session_id: {
          type: 'string',
          description: 'Filter by session ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 50)',
        },
      },
    },
  },
  {
    name: 'search_decisions',
    description: 'Search decision history with text search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for in decisions or rationale',
        },
        session_id: {
          type: 'string',
          description: 'Filter by session ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 50)',
        },
      },
    },
  },
  {
    name: 'get_incomplete_work',
    description: 'Get all unresolved incomplete work items that need attention',
    inputSchema: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical', 'all'],
          description: 'Filter by priority (default: all)',
        },
        include_resolved: {
          type: 'boolean',
          description: 'Include resolved items (default: false)',
        },
      },
    },
  },
  {
    name: 'get_task_history',
    description: 'Get complete history of status changes for a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID (e.g., TASK-001)',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'get_file_history',
    description: 'Get history of all actions affecting a file',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the file (supports partial match)',
        },
      },
      required: ['file_path'],
    },
  },
];

/**
 * Handle query tool calls
 */
export function handleQueryTool(
  name: string,
  args: Record<string, unknown>
): { success: boolean; data?: unknown; error?: string } {
  switch (name) {
    case 'search_actions': {
      const query = args.query as string | undefined;
      const type = args.type as ActionType | undefined;
      const sessionId = args.session_id as string | undefined;
      const limit = (args.limit as number) || 50;

      if (!query) {
        return {
          success: false,
          error: 'Query parameter is required for search_actions',
        };
      }

      const actions = searchActions(query, {
        sessionId,
        type,
        limit,
      });

      return {
        success: true,
        data: {
          count: actions.length,
          actions: actions.map((a) => ({
            id: a.id,
            sessionId: a.sessionId,
            timestamp: a.timestamp,
            type: a.type,
            tool: a.tool,
            filePath: a.filePath,
            description: a.description,
          })),
        },
      };
    }

    case 'search_decisions': {
      const query = args.query as string | undefined;
      const sessionId = args.session_id as string | undefined;
      const limit = (args.limit as number) || 50;

      if (!query) {
        return {
          success: false,
          error: 'Query parameter is required for search_decisions',
        };
      }

      const decisions = searchDecisions(query, {
        sessionId,
        limit,
      });

      return {
        success: true,
        data: {
          count: decisions.length,
          decisions: decisions.map((d) => ({
            id: d.id,
            sessionId: d.sessionId,
            timestamp: d.timestamp,
            decision: d.decision,
            rationale: d.rationale,
            alternatives: d.alternatives,
            impact: d.impact,
            category: d.category,
          })),
        },
      };
    }

    case 'get_incomplete_work': {
      const priority = args.priority as string | undefined;
      const includeResolved = args.include_resolved as boolean | undefined;

      let items: IncompleteWork[];

      if (includeResolved) {
        // Query all incomplete work including resolved
        const db = getDatabase();
        const rows = db
          .prepare(
            `SELECT * FROM incomplete_work
             ORDER BY
               CASE priority
                 WHEN 'critical' THEN 1
                 WHEN 'high' THEN 2
                 WHEN 'medium' THEN 3
                 WHEN 'low' THEN 4
               END,
               created_at ASC`
          )
          .all() as Array<{
          id: number;
          session_id: string;
          task_id: string;
          description: string;
          priority: string;
          reason: string | null;
          created_at: string;
          resolved_at: string | null;
          resolved_in_session_id: string | null;
        }>;

        items = rows.map((row) => ({
          id: String(row.id),
          sessionId: row.session_id,
          taskId: row.task_id,
          description: row.description,
          priority: row.priority as IncompleteWork['priority'],
          reason: row.reason || undefined,
          createdAt: row.created_at,
          resolvedAt: row.resolved_at || undefined,
          resolvedInSessionId: row.resolved_in_session_id || undefined,
        }));
      } else {
        items = getUnresolvedIncompleteWork();
      }

      // Filter by priority if specified
      if (priority && priority !== 'all') {
        items = items.filter((item) => item.priority === priority);
      }

      return {
        success: true,
        data: {
          count: items.length,
          unresolvedCount: items.filter((i) => !i.resolvedAt).length,
          items: items.map((item) => ({
            id: item.id,
            sessionId: item.sessionId,
            taskId: item.taskId,
            description: item.description,
            priority: item.priority,
            reason: item.reason,
            createdAt: item.createdAt,
            resolved: !!item.resolvedAt,
            resolvedAt: item.resolvedAt,
          })),
        },
      };
    }

    case 'get_task_history': {
      const taskId = args.task_id as string;

      if (!taskId) {
        return {
          success: false,
          error: 'task_id parameter is required for get_task_history',
        };
      }

      const history = getTaskHistory(taskId);

      return {
        success: true,
        data: {
          taskId,
          changeCount: history.length,
          history: history.map((h) => ({
            id: h.id,
            sessionId: h.sessionId,
            timestamp: h.timestamp,
            previousStatus: h.previousStatus,
            newStatus: h.newStatus,
            notes: h.notes,
          })),
          currentStatus: history.length > 0 ? history[history.length - 1].newStatus : 'unknown',
        },
      };
    }

    case 'get_file_history': {
      const filePath = args.file_path as string;

      if (!filePath) {
        return {
          success: false,
          error: 'file_path parameter is required for get_file_history',
        };
      }

      try {
        const history = getFileHistory(filePath);
        const actions = history || [];

        return {
          success: true,
          data: {
            filePath,
            actionCount: actions.length,
            actions: actions.map((a) => ({
              id: a.id,
              sessionId: a.sessionId,
              timestamp: a.timestamp,
              type: a.type,
              description: a.description,
            })),
            lastModified: actions.length > 0 ? actions[actions.length - 1].timestamp : null,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get file history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    default:
      return {
        success: false,
        error: `Unknown query tool: ${name}`,
      };
  }
}

/**
 * Check if a tool name is a query tool
 */
export function isQueryToolName(name: string): boolean {
  return queryTools.some((tool) => tool.name === name);
}
