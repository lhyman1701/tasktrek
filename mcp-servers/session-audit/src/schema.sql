-- Session Audit MCP Server - Database Schema
-- Version: 1

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    start_time TEXT NOT NULL,
    end_time TEXT,
    project_path TEXT NOT NULL,
    branch TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    summary TEXT
);

-- Actions table (tool calls, file operations, commands, etc.)
CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tool_call', 'file_read', 'file_write', 'file_edit', 'command', 'search', 'decision', 'task_change', 'error', 'other')),
    tool TEXT,
    file_path TEXT,
    description TEXT NOT NULL,
    metadata TEXT, -- JSON
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    decision TEXT NOT NULL,
    rationale TEXT NOT NULL,
    alternatives TEXT, -- JSON array
    impact TEXT CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    category TEXT CHECK (category IN ('architecture', 'implementation', 'testing', 'refactoring', 'bugfix', 'documentation', 'configuration', 'other')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Task state changes
CREATE TABLE IF NOT EXISTS task_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    task_id TEXT NOT NULL,
    previous_status TEXT CHECK (previous_status IN ('not_started', 'in_progress', 'blocked', 'complete', 'skipped')),
    new_status TEXT NOT NULL CHECK (new_status IN ('not_started', 'in_progress', 'blocked', 'complete', 'skipped')),
    notes TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Incomplete work tracking
CREATE TABLE IF NOT EXISTS incomplete_work (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    reason TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    resolved_in_session_id TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_in_session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Schema version for migrations
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_actions_session ON actions(session_id);
CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(type);
CREATE INDEX IF NOT EXISTS idx_actions_timestamp ON actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_actions_file_path ON actions(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_tool ON actions(tool) WHERE tool IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_decisions_session ON decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions(timestamp);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_states_session ON task_states(session_id);
CREATE INDEX IF NOT EXISTS idx_task_states_task ON task_states(task_id);
CREATE INDEX IF NOT EXISTS idx_task_states_timestamp ON task_states(timestamp);

CREATE INDEX IF NOT EXISTS idx_incomplete_session ON incomplete_work(session_id);
CREATE INDEX IF NOT EXISTS idx_incomplete_task ON incomplete_work(task_id);
CREATE INDEX IF NOT EXISTS idx_incomplete_unresolved ON incomplete_work(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_incomplete_priority ON incomplete_work(priority);

-- Insert initial schema version
INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (1, datetime('now'));
