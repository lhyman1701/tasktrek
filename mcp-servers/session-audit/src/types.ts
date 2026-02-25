/**
 * Session Audit MCP Server - Type Definitions
 *
 * Core interfaces for the session audit system.
 */

/**
 * Represents a Claude Code session
 */
export interface Session {
  id: string;
  startTime: string; // ISO 8601 timestamp
  endTime?: string; // ISO 8601 timestamp, undefined if session active
  projectPath: string;
  branch?: string;
  status: 'active' | 'completed' | 'abandoned';
  summary?: string;
}

/**
 * Represents an action taken during a session (tool call, file operation, etc.)
 */
export interface Action {
  id: string;
  sessionId: string;
  timestamp: string; // ISO 8601 timestamp
  type: ActionType;
  tool?: string; // Tool name if type is 'tool_call'
  filePath?: string; // File path if type is 'file_*'
  description: string;
  metadata?: Record<string, unknown>;
}

export type ActionType =
  | 'tool_call'
  | 'file_read'
  | 'file_write'
  | 'file_edit'
  | 'command'
  | 'search'
  | 'decision'
  | 'task_change'
  | 'error'
  | 'other';

/**
 * Represents a decision made during a session
 */
export interface Decision {
  id: string;
  sessionId: string;
  timestamp: string; // ISO 8601 timestamp
  decision: string;
  rationale: string;
  alternatives?: string[];
  impact?: 'low' | 'medium' | 'high' | 'critical';
  category?: DecisionCategory;
}

export type DecisionCategory =
  | 'architecture'
  | 'implementation'
  | 'testing'
  | 'refactoring'
  | 'bugfix'
  | 'documentation'
  | 'configuration'
  | 'other';

/**
 * Represents a task state change
 */
export interface TaskState {
  id: string;
  sessionId: string;
  timestamp: string; // ISO 8601 timestamp
  taskId: string; // e.g., "TASK-001"
  previousStatus?: TaskStatus;
  newStatus: TaskStatus;
  notes?: string;
}

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'complete'
  | 'skipped';

/**
 * Represents incomplete work that needs to be surfaced at session start
 */
export interface IncompleteWork {
  id: string;
  sessionId: string; // Session where work was left incomplete
  taskId: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  createdAt: string; // ISO 8601 timestamp
  resolvedAt?: string; // ISO 8601 timestamp, undefined if still incomplete
  resolvedInSessionId?: string;
}

/**
 * Session context for handoff
 */
export interface SessionContext {
  session: Session;
  recentActions: Action[];
  recentDecisions: Decision[];
  taskChanges: TaskState[];
  incompleteWork: IncompleteWork[];
  filesModified: string[];
  summary: string;
}

/**
 * Search options for querying the audit database
 */
export interface SearchOptions {
  sessionId?: string;
  startTime?: string;
  endTime?: string;
  type?: ActionType | ActionType[];
  limit?: number;
  offset?: number;
}

/**
 * Tool result wrapper
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
