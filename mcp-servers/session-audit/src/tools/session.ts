/**
 * Session Audit MCP Server - Session Tools
 *
 * Tools for session lifecycle management (start, end, context retrieval).
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  createSession,
  updateSession,
  getSession,
  getLatestSession,
  getRecentSessions,
  getSessionActions,
  getSessionDecisions,
  getUnresolvedIncompleteWork,
  logIncompleteWork,
  getDatabase,
} from '../database.js';

/**
 * Tool definitions for session management
 */
export const sessionTools: Tool[] = [
  {
    name: 'start_session',
    description: 'Start a new audit session. Returns incomplete work from previous sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        project_path: {
          type: 'string',
          description: 'Path to the project being worked on',
        },
        branch: {
          type: 'string',
          description: 'Git branch name (optional)',
        },
      },
      required: ['project_path'],
    },
  },
  {
    name: 'end_session',
    description: 'End the current session with a summary',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Summary of what was accomplished',
        },
        incomplete_work: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task_id: { type: 'string' },
              description: { type: 'string' },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
              reason: { type: 'string' },
            },
            required: ['task_id', 'description'],
          },
          description: 'Work that was not completed',
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'get_current_session',
    description: 'Get details of the current active session',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_session_context',
    description:
      'Get context for continuing work (incomplete work, recent actions from last session)',
    inputSchema: {
      type: 'object',
      properties: {
        recent_actions_limit: {
          type: 'number',
          description: 'Number of recent actions to include (default: 20)',
        },
        recent_decisions_limit: {
          type: 'number',
          description: 'Number of recent decisions to include (default: 10)',
        },
      },
    },
  },
];

/**
 * Handle session tool calls
 */
export function handleSessionTool(
  name: string,
  args: Record<string, unknown>
): { success: boolean; data?: unknown; error?: string } {
  switch (name) {
    case 'start_session': {
      const projectPath = args.project_path as string;
      const branch = args.branch as string | undefined;

      if (!projectPath) {
        return {
          success: false,
          error: 'project_path is required for start_session',
        };
      }

      // Check if there's already an active session
      const existingSession = getLatestSession();
      if (existingSession && existingSession.status === 'active') {
        return {
          success: false,
          error: `Session ${existingSession.id} is already active. End it first with end_session.`,
        };
      }

      // Generate session ID
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create new session
      const session = createSession(sessionId, projectPath, branch);

      // Get incomplete work from previous sessions
      const incompleteWork = getUnresolvedIncompleteWork();

      return {
        success: true,
        data: {
          message: 'Session started',
          sessionId: session.id,
          startTime: session.startTime,
          projectPath: session.projectPath,
          branch: session.branch,
          incompleteWorkCount: incompleteWork.length,
          incompleteWork: incompleteWork.map((w) => ({
            taskId: w.taskId,
            description: w.description,
            priority: w.priority,
            reason: w.reason,
            fromSession: w.sessionId,
            createdAt: w.createdAt,
          })),
        },
      };
    }

    case 'end_session': {
      const summary = args.summary as string;
      const incompleteWorkItems = args.incomplete_work as
        | Array<{
            task_id: string;
            description: string;
            priority?: string;
            reason?: string;
          }>
        | undefined;

      if (!summary) {
        return {
          success: false,
          error: 'summary is required for end_session',
        };
      }

      // Get current session
      const session = getLatestSession();
      if (!session || session.status !== 'active') {
        return {
          success: false,
          error: 'No active session to end',
        };
      }

      // Log incomplete work items
      if (incompleteWorkItems && incompleteWorkItems.length > 0) {
        for (const item of incompleteWorkItems) {
          logIncompleteWork(session.id, item.task_id, item.description, {
            priority: (item.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
            reason: item.reason,
          });
        }
      }

      // Get session stats
      const actions = getSessionActions(session.id);
      const decisions = getSessionDecisions(session.id);

      // Calculate duration
      const startTime = new Date(session.startTime);
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      // Update session
      updateSession(session.id, {
        endTime: endTime.toISOString(),
        status: 'completed',
        summary,
      });

      return {
        success: true,
        data: {
          message: 'Session ended',
          sessionId: session.id,
          durationMinutes,
          actionsLogged: actions.length,
          decisionsLogged: decisions.length,
          incompleteWorkFlagged: incompleteWorkItems?.length || 0,
          summary,
        },
      };
    }

    case 'get_current_session': {
      const session = getLatestSession();

      if (!session) {
        return {
          success: true,
          data: {
            hasActiveSession: false,
            message: 'No session found. Start one with start_session.',
          },
        };
      }

      const actions = getSessionActions(session.id, { limit: 10 });
      const decisions = getSessionDecisions(session.id, { limit: 5 });

      return {
        success: true,
        data: {
          hasActiveSession: session.status === 'active',
          session: {
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            status: session.status,
            projectPath: session.projectPath,
            branch: session.branch,
            summary: session.summary,
          },
          recentActions: actions.length,
          recentDecisions: decisions.length,
        },
      };
    }

    case 'get_session_context': {
      const recentActionsLimit = (args.recent_actions_limit as number) || 20;
      const recentDecisionsLimit = (args.recent_decisions_limit as number) || 10;

      // Get recent sessions
      const recentSessions = getRecentSessions(3);

      // Get incomplete work
      const incompleteWork = getUnresolvedIncompleteWork();

      // Get last completed session
      const lastCompleted = recentSessions.find((s) => s.status === 'completed');

      let recentActions: unknown[] = [];
      let recentDecisions: unknown[] = [];

      if (lastCompleted) {
        const actions = getSessionActions(lastCompleted.id, { limit: recentActionsLimit });
        const decisions = getSessionDecisions(lastCompleted.id, { limit: recentDecisionsLimit });

        recentActions = actions.map((a) => ({
          timestamp: a.timestamp,
          type: a.type,
          description: a.description,
          tool: a.tool,
          filePath: a.filePath,
        }));

        recentDecisions = decisions.map((d) => ({
          timestamp: d.timestamp,
          decision: d.decision,
          rationale: d.rationale,
          category: d.category,
        }));
      }

      // Generate recommendation based on incomplete work
      let recommendation = 'No incomplete work. Ready to start new tasks.';
      if (incompleteWork.length > 0) {
        const critical = incompleteWork.filter((w) => w.priority === 'critical');
        const high = incompleteWork.filter((w) => w.priority === 'high');

        if (critical.length > 0) {
          recommendation = `CRITICAL: Complete ${critical[0].taskId} first - ${critical[0].description}`;
        } else if (high.length > 0) {
          recommendation = `HIGH PRIORITY: Complete ${high[0].taskId} - ${high[0].description}`;
        } else {
          recommendation = `Continue with ${incompleteWork[0].taskId} - ${incompleteWork[0].description}`;
        }
      }

      return {
        success: true,
        data: {
          lastSession: lastCompleted
            ? {
                id: lastCompleted.id,
                endTime: lastCompleted.endTime,
                summary: lastCompleted.summary,
              }
            : null,
          incompleteWorkCount: incompleteWork.length,
          incompleteWork: incompleteWork.map((w) => ({
            taskId: w.taskId,
            description: w.description,
            priority: w.priority,
            reason: w.reason,
          })),
          recentActions,
          recentDecisions,
          recommendation,
        },
      };
    }

    default:
      return {
        success: false,
        error: `Unknown session tool: ${name}`,
      };
  }
}

/**
 * Check if a tool name is a session tool
 */
export function isSessionToolName(name: string): boolean {
  return sessionTools.some((tool) => tool.name === name);
}
