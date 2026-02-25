# Session Audit MCP Server

MCP server for automatic session auditing, logging, and context retrieval for Claude Code sessions.

## Purpose

This server solves the session continuity problem by automatically:
- Tracking all actions taken during a session
- Recording decisions with rationale
- Monitoring task state changes
- Flagging incomplete work for handoff
- Providing rich context at session start

## Installation

```bash
cd mcp-servers/session-audit
npm install
npm run build
```

## Usage

Add to your Claude Code settings (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "session-audit": {
      "command": "node",
      "args": ["{{PROJECT_PATH}}/mcp-servers/session-audit/dist/index.js"]
    }
  }
}
```

## Tools

### Core Logging
- `log_action` - Log a tool call, file operation, or other action
- `log_decision` - Record a decision with rationale
- `log_task_change` - Track task status changes
- `mark_incomplete` - Flag work for next session

### Search
- `search_actions` - Search logged actions
- `search_decisions` - Search logged decisions

### History
- `get_task_history` - Get history of a specific task
- `get_file_history` - Get history of operations on a file
- `get_incomplete_work` - Get all unresolved incomplete work

### Session
- `start_session` - Initialize a new session
- `end_session` - Complete a session with summary
- `get_current_session` - Get current session details
- `get_session_context` - Get context from previous sessions

## Data Storage

Uses SQLite database at `data/session_audit.db` for:
- Sessions table
- Actions table
- Decisions table
- Task states table
- Incomplete work table

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Run
npm start
```
