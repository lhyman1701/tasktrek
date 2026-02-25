/**
 * Session Audit MCP Server - Capture Tools
 *
 * Tools for logging actions, decisions, task changes, and incomplete work.
 * These are the "write" tools that capture session activity.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  logAction,
  logDecision,
  logTaskStateChange,
  logIncompleteWork,
  getLatestSession,
} from '../database.js';
import type { ActionType, TaskStatus } from '../types.js';

/**
 * Tool definitions for capture operations
 */
export const captureTools: Tool[] = [
  {
    name: 'log_action',
    description:
      'Log an action taken during the session (tool call, file operation, command, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
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
          description: 'Type of action',
        },
        description: {
          type: 'string',
          description: 'Description of what was done',
        },
        tool: {
          type: 'string',
          description: 'Name of the tool if type is tool_call',
        },
        file_path: {
          type: 'string',
          description: 'File path if action involves a file',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata as key-value pairs',
        },
      },
      required: ['type', 'description'],
    },
  },
  {
    name: 'log_decision',
    description:
      'Log a decision made during the session with rationale and alternatives',
    inputSchema: {
      type: 'object',
      properties: {
        decision: {
          type: 'string',
          description: 'The decision that was made',
        },
        rationale: {
          type: 'string',
          description: 'Why this decision was made',
        },
        alternatives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Other options that were considered',
        },
        impact: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Impact level of the decision',
        },
        category: {
          type: 'string',
          enum: [
            'architecture',
            'implementation',
            'testing',
            'refactoring',
            'bugfix',
            'documentation',
            'configuration',
            'other',
          ],
          description: 'Category of decision',
        },
      },
      required: ['decision', 'rationale'],
    },
  },
  {
    name: 'log_task_change',
    description: 'Log a change in task status',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID (e.g., TASK-001)',
        },
        new_status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'blocked', 'complete', 'skipped'],
          description: 'New status of the task',
        },
        previous_status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'blocked', 'complete', 'skipped'],
          description: 'Previous status (optional)',
        },
        notes: {
          type: 'string',
          description: 'Notes about the status change',
        },
      },
      required: ['task_id', 'new_status'],
    },
  },
  {
    name: 'mark_incomplete',
    description:
      'Mark work as incomplete for the next session to pick up',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID that has incomplete work',
        },
        description: {
          type: 'string',
          description: 'What specifically is incomplete',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Priority level (default: medium)',
        },
        reason: {
          type: 'string',
          description: 'Why the work is incomplete',
        },
      },
      required: ['task_id', 'description'],
    },
  },
];

/**
 * Handle capture tool calls
 */
export function handleCaptureTool(
  name: string,
  args: Record<string, unknown>
): { success: boolean; data?: unknown; error?: string } {
  // Get the current session
  const session = getLatestSession();
  if (!session || session.status !== 'active') {
    return {
      success: false,
      error: 'No active session. Start a session first with start_session.',
    };
  }

  const sessionId = session.id;

  switch (name) {
    case 'log_action': {
      const type = args.type as ActionType;
      const description = args.description as string;
      const tool = args.tool as string | undefined;
      const filePath = args.file_path as string | undefined;
      const metadata = args.metadata as Record<string, unknown> | undefined;

      const action = logAction(sessionId, type, description, {
        tool,
        filePath,
        metadata,
      });

      return {
        success: true,
        data: {
          message: 'Action logged',
          id: action.id,
          type: action.type,
          timestamp: action.timestamp,
        },
      };
    }

    case 'log_decision': {
      const decision = args.decision as string;
      const rationale = args.rationale as string;
      const alternatives = args.alternatives as string[] | undefined;
      const impact = args.impact as 'low' | 'medium' | 'high' | 'critical' | undefined;
      const category = args.category as
        | 'architecture'
        | 'implementation'
        | 'testing'
        | 'refactoring'
        | 'bugfix'
        | 'documentation'
        | 'configuration'
        | 'other'
        | undefined;

      const logged = logDecision(sessionId, decision, rationale, {
        alternatives,
        impact,
        category,
      });

      return {
        success: true,
        data: {
          message: 'Decision logged',
          id: logged.id,
          decision: logged.decision,
          timestamp: logged.timestamp,
        },
      };
    }

    case 'log_task_change': {
      const taskId = args.task_id as string;
      const newStatus = args.new_status as TaskStatus;
      const previousStatus = args.previous_status as TaskStatus | undefined;
      const notes = args.notes as string | undefined;

      const taskState = logTaskStateChange(sessionId, taskId, newStatus, {
        previousStatus,
        notes,
      });

      return {
        success: true,
        data: {
          message: 'Task status change logged',
          id: taskState.id,
          taskId: taskState.taskId,
          newStatus: taskState.newStatus,
          timestamp: taskState.timestamp,
        },
      };
    }

    case 'mark_incomplete': {
      const taskId = args.task_id as string;
      const description = args.description as string;
      const priority = (args.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium';
      const reason = args.reason as string | undefined;

      const incomplete = logIncompleteWork(sessionId, taskId, description, {
        priority,
        reason,
      });

      return {
        success: true,
        data: {
          message: 'Incomplete work marked',
          id: incomplete.id,
          taskId: incomplete.taskId,
          priority: incomplete.priority,
          timestamp: incomplete.createdAt,
        },
      };
    }

    default:
      return {
        success: false,
        error: `Unknown capture tool: ${name}`,
      };
  }
}

/**
 * Check if a tool name is a capture tool
 */
export function isCaptureToolName(name: string): boolean {
  return captureTools.some((tool) => tool.name === name);
}
