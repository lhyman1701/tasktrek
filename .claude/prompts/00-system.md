# System Context - {{PROJECT_NAME}}

## Session Protocol

### At Session Start

1. Read `SESSION_START.md` for context from last session
2. Start session-audit: `mcp__session-audit__start_session(project_path="{{PROJECT_PATH}}")`
3. Acknowledge session context before proceeding

### During Session

- Log actions in real-time (every 2-3 tool calls minimum)
- Use `log_action()`, `log_decision()`, `log_task_change()`
- Update progress in active task file

### At Session End

- Update `SESSION_START.md` with current state
- Run `mcp__session-audit__end_session(summary="...")`

## Session-Audit Logging (MANDATORY)

```python
# REAL-TIME throughout session (NOT at the end, DURING work):
mcp__session-audit__log_action(type="file_edit", file_path="...", description="...")
mcp__session-audit__log_action(type="file_read", file_path="...", description="...")
mcp__session-audit__log_action(type="command", description="npm test - result: ...")
mcp__session-audit__log_decision(decision="...", rationale="...", category="...", impact="...")
mcp__session-audit__log_task_change(task_id="...", new_status="...", notes="...")
```

**LOGGING FREQUENCY: Minimum 1 log per 2-3 tool calls. If 5+ tool calls without logging = VIOLATION.**

## Key Files Reference

| File                         | Purpose                           |
| ---------------------------- | --------------------------------- |
| `SESSION_START.md`           | Current session state             |
| `.claude/PROJECT_CONTEXT.md` | Full project context              |
| `.wave-config.json`          | Wave definitions                  |
| `tasks/*.md`                 | Detailed task specifications      |
| `progress/*.md`              | Wave progress files               |

## Slash Commands

| Command          | Purpose                           |
| ---------------- | --------------------------------- |
| `/session-start` | Begin session - reads all context |
| `/plan-first`    | MANDATORY before coding           |
| `/next-task`     | Get next task from wave           |
| `/commit-work`   | Commit with quality checks        |
| `/end-session`   | End session properly              |
