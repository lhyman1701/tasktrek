/**
 * Session Audit MCP Server - Database Module
 *
 * Provides SQLite database connection, schema initialization,
 * and core query functions for the session audit system.
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  Session,
  Action,
  Decision,
  TaskState,
  IncompleteWork,
  ActionType,
  TaskStatus,
} from './types.js';

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default database path
const DEFAULT_DB_PATH = join(__dirname, '..', 'data', 'session_audit.db');

// Current schema version
const CURRENT_SCHEMA_VERSION = 1;

/**
 * Database singleton instance
 */
let db: Database.Database | null = null;

/**
 * Get or create the database connection
 */
export function getDatabase(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  if (db) {
    return db;
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Set busy timeout to 5 seconds
  db.pragma('busy_timeout = 5000');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema if needed
  initializeSchema(db);

  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Initialize the database schema
 */
function initializeSchema(database: Database.Database): void {
  // Check current schema version
  const versionTable = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    )
    .get();

  if (!versionTable) {
    // First run - apply full schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    database.exec(schema);
    console.error(`Database schema v${CURRENT_SCHEMA_VERSION} initialized`);
  } else {
    // Check if migrations needed
    const currentVersion = database
      .prepare('SELECT MAX(version) as version FROM schema_version')
      .get() as { version: number } | undefined;

    if (currentVersion && currentVersion.version < CURRENT_SCHEMA_VERSION) {
      // Future: run migrations here
      console.error(
        `Database migration needed: v${currentVersion.version} -> v${CURRENT_SCHEMA_VERSION}`
      );
    }
  }
}

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Create a new session
 */
export function createSession(
  id: string,
  projectPath: string,
  branch?: string
): Session {
  const db = getDatabase();
  const startTime = new Date().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, start_time, project_path, branch, status)
     VALUES (?, ?, ?, ?, 'active')`
  ).run(id, startTime, projectPath, branch || null);

  return {
    id,
    startTime,
    projectPath,
    branch,
    status: 'active',
  };
}

/**
 * Update a session (end it, add summary, etc.)
 */
export function updateSession(
  id: string,
  updates: Partial<Pick<Session, 'endTime' | 'status' | 'summary'>>
): void {
  const db = getDatabase();
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.endTime !== undefined) {
    setClauses.push('end_time = ?');
    values.push(updates.endTime);
  }
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    values.push(updates.status);
  }
  if (updates.summary !== undefined) {
    setClauses.push('summary = ?');
    values.push(updates.summary);
  }

  if (setClauses.length > 0) {
    values.push(id);
    db.prepare(`UPDATE sessions SET ${setClauses.join(', ')} WHERE id = ?`).run(
      ...values
    );
  }
}

/**
 * Get a session by ID
 */
export function getSession(id: string): Session | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as
    | {
        id: string;
        start_time: string;
        end_time: string | null;
        project_path: string;
        branch: string | null;
        status: string;
        summary: string | null;
      }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time || undefined,
    projectPath: row.project_path,
    branch: row.branch || undefined,
    status: row.status as Session['status'],
    summary: row.summary || undefined,
  };
}

/**
 * Get the most recent session
 */
export function getLatestSession(): Session | null {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM sessions ORDER BY start_time DESC LIMIT 1')
    .get() as
    | {
        id: string;
        start_time: string;
        end_time: string | null;
        project_path: string;
        branch: string | null;
        status: string;
        summary: string | null;
      }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time || undefined,
    projectPath: row.project_path,
    branch: row.branch || undefined,
    status: row.status as Session['status'],
    summary: row.summary || undefined,
  };
}

// ============================================================================
// Action Operations
// ============================================================================

/**
 * Log an action
 */
export function logAction(
  sessionId: string,
  type: ActionType,
  description: string,
  options?: {
    tool?: string;
    filePath?: string;
    metadata?: Record<string, unknown>;
  }
): Action {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  db.prepare(
    `INSERT INTO actions (session_id, timestamp, type, tool, file_path, description, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    sessionId,
    timestamp,
    type,
    options?.tool || null,
    options?.filePath || null,
    description,
    options?.metadata ? JSON.stringify(options.metadata) : null
  );

  return {
    id,
    sessionId,
    timestamp,
    type,
    tool: options?.tool,
    filePath: options?.filePath,
    description,
    metadata: options?.metadata,
  };
}

/**
 * Get actions for a session
 */
export function getSessionActions(
  sessionId: string,
  options?: { limit?: number; type?: ActionType }
): Action[] {
  const db = getDatabase();
  let query = 'SELECT * FROM actions WHERE session_id = ?';
  const params: unknown[] = [sessionId];

  if (options?.type) {
    query += ' AND type = ?';
    params.push(options.type);
  }

  query += ' ORDER BY timestamp DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = db.prepare(query).all(...params) as Array<{
    id: number;
    session_id: string;
    timestamp: string;
    type: string;
    tool: string | null;
    file_path: string | null;
    description: string;
    metadata: string | null;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: row.session_id,
    timestamp: row.timestamp,
    type: row.type as ActionType,
    tool: row.tool || undefined,
    filePath: row.file_path || undefined,
    description: row.description,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

// ============================================================================
// Decision Operations
// ============================================================================

/**
 * Log a decision
 */
export function logDecision(
  sessionId: string,
  decision: string,
  rationale: string,
  options?: {
    alternatives?: string[];
    impact?: Decision['impact'];
    category?: Decision['category'];
  }
): Decision {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  db.prepare(
    `INSERT INTO decisions (session_id, timestamp, decision, rationale, alternatives, impact, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    sessionId,
    timestamp,
    decision,
    rationale,
    options?.alternatives ? JSON.stringify(options.alternatives) : null,
    options?.impact || null,
    options?.category || null
  );

  return {
    id,
    sessionId,
    timestamp,
    decision,
    rationale,
    alternatives: options?.alternatives,
    impact: options?.impact,
    category: options?.category,
  };
}

/**
 * Get decisions for a session
 */
export function getSessionDecisions(
  sessionId: string,
  options?: { limit?: number }
): Decision[] {
  const db = getDatabase();
  let query = 'SELECT * FROM decisions WHERE session_id = ? ORDER BY timestamp DESC';
  const params: unknown[] = [sessionId];

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = db.prepare(query).all(...params) as Array<{
    id: number;
    session_id: string;
    timestamp: string;
    decision: string;
    rationale: string;
    alternatives: string | null;
    impact: string | null;
    category: string | null;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: row.session_id,
    timestamp: row.timestamp,
    decision: row.decision,
    rationale: row.rationale,
    alternatives: row.alternatives ? JSON.parse(row.alternatives) : undefined,
    impact: row.impact as Decision['impact'],
    category: row.category as Decision['category'],
  }));
}

// ============================================================================
// Task State Operations
// ============================================================================

/**
 * Log a task state change
 */
export function logTaskStateChange(
  sessionId: string,
  taskId: string,
  newStatus: TaskStatus,
  options?: { previousStatus?: TaskStatus; notes?: string }
): TaskState {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  db.prepare(
    `INSERT INTO task_states (session_id, timestamp, task_id, previous_status, new_status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    sessionId,
    timestamp,
    taskId,
    options?.previousStatus || null,
    newStatus,
    options?.notes || null
  );

  return {
    id,
    sessionId,
    timestamp,
    taskId,
    previousStatus: options?.previousStatus,
    newStatus,
    notes: options?.notes,
  };
}

/**
 * Get task history
 */
export function getTaskHistory(taskId: string): TaskState[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT * FROM task_states WHERE task_id = ? ORDER BY timestamp ASC'
    )
    .all(taskId) as Array<{
    id: number;
    session_id: string;
    timestamp: string;
    task_id: string;
    previous_status: string | null;
    new_status: string;
    notes: string | null;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: row.session_id,
    timestamp: row.timestamp,
    taskId: row.task_id,
    previousStatus: row.previous_status as TaskStatus | undefined,
    newStatus: row.new_status as TaskStatus,
    notes: row.notes || undefined,
  }));
}

// ============================================================================
// Incomplete Work Operations
// ============================================================================

/**
 * Log incomplete work
 */
export function logIncompleteWork(
  sessionId: string,
  taskId: string,
  description: string,
  options?: { priority?: IncompleteWork['priority']; reason?: string }
): IncompleteWork {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO incomplete_work (session_id, task_id, description, priority, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    sessionId,
    taskId,
    description,
    options?.priority || 'medium',
    options?.reason || null,
    createdAt
  );

  return {
    id,
    sessionId,
    taskId,
    description,
    priority: options?.priority || 'medium',
    reason: options?.reason,
    createdAt,
  };
}

/**
 * Resolve incomplete work
 */
export function resolveIncompleteWork(
  taskId: string,
  resolvedInSessionId: string
): void {
  const db = getDatabase();
  const resolvedAt = new Date().toISOString();

  db.prepare(
    `UPDATE incomplete_work
     SET resolved_at = ?, resolved_in_session_id = ?
     WHERE task_id = ? AND resolved_at IS NULL`
  ).run(resolvedAt, resolvedInSessionId, taskId);
}

/**
 * Get all unresolved incomplete work
 */
export function getUnresolvedIncompleteWork(): IncompleteWork[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT * FROM incomplete_work
       WHERE resolved_at IS NULL
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

  return rows.map((row) => ({
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
}

// ============================================================================
// Search Operations
// ============================================================================

/**
 * Search actions by description or file path
 */
export function searchActions(
  query: string,
  options?: { sessionId?: string; type?: ActionType; limit?: number }
): Action[] {
  const db = getDatabase();
  let sql =
    'SELECT * FROM actions WHERE (description LIKE ? OR file_path LIKE ? OR tool LIKE ?)';
  const params: unknown[] = [`%${query}%`, `%${query}%`, `%${query}%`];

  if (options?.sessionId) {
    sql += ' AND session_id = ?';
    params.push(options.sessionId);
  }

  if (options?.type) {
    sql += ' AND type = ?';
    params.push(options.type);
  }

  sql += ' ORDER BY timestamp DESC';

  if (options?.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = db.prepare(sql).all(...params) as Array<{
    id: number;
    session_id: string;
    timestamp: string;
    type: string;
    tool: string | null;
    file_path: string | null;
    description: string;
    metadata: string | null;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: row.session_id,
    timestamp: row.timestamp,
    type: row.type as ActionType,
    tool: row.tool || undefined,
    filePath: row.file_path || undefined,
    description: row.description,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

/**
 * Search decisions
 */
export function searchDecisions(
  query: string,
  options?: { sessionId?: string; limit?: number }
): Decision[] {
  const db = getDatabase();
  let sql =
    'SELECT * FROM decisions WHERE (decision LIKE ? OR rationale LIKE ?)';
  const params: unknown[] = [`%${query}%`, `%${query}%`];

  if (options?.sessionId) {
    sql += ' AND session_id = ?';
    params.push(options.sessionId);
  }

  sql += ' ORDER BY timestamp DESC';

  if (options?.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = db.prepare(sql).all(...params) as Array<{
    id: number;
    session_id: string;
    timestamp: string;
    decision: string;
    rationale: string;
    alternatives: string | null;
    impact: string | null;
    category: string | null;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: row.session_id,
    timestamp: row.timestamp,
    decision: row.decision,
    rationale: row.rationale,
    alternatives: row.alternatives ? JSON.parse(row.alternatives) : undefined,
    impact: row.impact as Decision['impact'],
    category: row.category as Decision['category'],
  }));
}

/**
 * Get file history (all actions on a file)
 */
export function getFileHistory(filePath: string): Action[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT * FROM actions WHERE file_path LIKE ? ORDER BY timestamp ASC'
    )
    .all(`%${filePath}%`) as Array<{
    id: number;
    session_id: string;
    timestamp: string;
    type: string;
    tool: string | null;
    file_path: string | null;
    description: string;
    metadata: string | null;
  }>;

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: row.session_id,
    timestamp: row.timestamp,
    type: row.type as ActionType,
    tool: row.tool || undefined,
    filePath: row.file_path || undefined,
    description: row.description,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}

/**
 * Get recent sessions
 */
export function getRecentSessions(limit: number = 10): Session[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM sessions ORDER BY start_time DESC LIMIT ?')
    .all(limit) as Array<{
    id: string;
    start_time: string;
    end_time: string | null;
    project_path: string;
    branch: string | null;
    status: string;
    summary: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time || undefined,
    projectPath: row.project_path,
    branch: row.branch || undefined,
    status: row.status as Session['status'],
    summary: row.summary || undefined,
  }));
}
