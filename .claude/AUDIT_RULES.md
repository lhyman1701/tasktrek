# Session Audit Rules

## Real-Time Logging Requirements

### Logging Frequency

**MINIMUM: 1 log per 2-3 tool calls**

If 5+ tool calls occur without logging, this is a VIOLATION.

### What to Log

#### Actions (`log_action`)

Log every significant action:
- File reads (important files only)
- File edits (all)
- Commands run (all)
- Tests executed (all)

```python
mcp__session-audit__log_action(
    type="file_edit",
    file_path="src/component.ts",
    description="Added validation logic for user input"
)
```

#### Decisions (`log_decision`)

Log every decision with impact:
- Architecture choices
- Implementation approach
- Trade-off decisions
- Deviation from plan

```python
mcp__session-audit__log_decision(
    decision="Use useState instead of useReducer",
    rationale="Simple state with few transitions; useReducer adds unnecessary complexity",
    category="implementation",
    impact="low"
)
```

#### Task Changes (`log_task_change`)

Log every task status change:
- Starting a task
- Completing a task
- Blocking on a task
- Abandoning a task

```python
mcp__session-audit__log_task_change(
    task_id="TASK-001",
    new_status="completed",
    notes="All acceptance criteria met, tests passing"
)
```

#### Incomplete Work (`mark_incomplete`)

Log ANY work that will need to continue:
- Unfinished features
- Known bugs to fix
- Documentation to write
- Tests to add

```python
mcp__session-audit__mark_incomplete(
    work_type="feature",
    description="User profile page - edit mode not implemented",
    priority="high",
    reason="Session ending, need to continue in next session"
)
```

## Session Lifecycle

### Start Session

```python
mcp__session-audit__start_session(
    project_path="/path/to/project"
)
```

### During Session

- Log continuously (see frequency above)
- Update progress files
- Track task state changes

### End Session

```python
mcp__session-audit__end_session(
    summary="Completed TASK-001, TASK-002. In progress: TASK-003. Blocker: waiting on API spec."
)
```

## Query Tools

### Search Actions

Find previous actions for context:

```python
mcp__session-audit__search_actions(
    file_path="src/component.ts",  # optional
    type="file_edit",               # optional
    limit=10
)
```

### Search Decisions

Find previous decisions:

```python
mcp__session-audit__search_decisions(
    category="architecture",  # optional
    limit=10
)
```

### Get Incomplete Work

Find work that needs attention:

```python
mcp__session-audit__get_incomplete_work()
```

### Get Session Context

Get summary of current session:

```python
mcp__session-audit__get_session_context()
```
