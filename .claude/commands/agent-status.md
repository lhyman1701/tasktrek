# Agent Status Command

Drill into a single agent/thread within the current active wave.

## Usage

```
/agent-status $ARGUMENTS
```

Where `$ARGUMENTS` is the thread/agent identifier (name or module hint).

**Examples:**
- `/agent-status API`
- `/agent-status Auth`
- `/agent-status Backend`
- `/agent-status Frontend`
- `/agent-status Workflow`

## Files to Read

1. **`.wave-config.json`** - Get active wave and module definitions
2. **`waves/wave-{ID}-*.md`** - Wave specification
3. **`progress/wave-{ID}-status.md`** - Current progress

## Analysis Steps

1. **Identify Active Wave**
   - Check `.wave-config.json` for `current_state.active_wave`

2. **Find Matching Thread**
   - Parse `$ARGUMENTS` (case-insensitive)
   - Match against:
     - Thread names from the progress file
     - Module paths containing the argument
     - Task prefixes or categories
   - Partial matching is acceptable (e.g., "Auth" matches "Auth Services")

3. **Gather Thread Details**
   - List all tasks assigned to this thread
   - Get status of each task
   - Collect any notes, errors, or flags

## Output Format

```
## Agent: {Thread Name}

**Wave:** {ID} - {Name}
**Modules:** {comma-separated list}
**Status:** {In Progress/Complete/Blocked/Idle}

### Tasks

| Task ID | Name | Status | Notes |
|---------|------|--------|-------|
| TASK-001a | First subtask | Complete | Done |
| TASK-001b | Second subtask | Complete | Done |

### Summary

**Completed:** X/Y tasks
**Remaining Work:**
- {List of pending tasks with brief description}

### Suggested Next Steps

1. {Actionable next step}
2. {Follow-up action}

### Risk Flags

- {Any warnings or issues from progress notes}
```

## Handling No Match

If `$ARGUMENTS` doesn't match any known thread:

```
## No Match Found

Could not find a thread matching "{$ARGUMENTS}".

**Available threads in Wave {ID}:**
- Auth Services (modules: services/auth, shared/auth)
- Backend Services (modules: services/api, shared/core)
- Frontend (modules: frontend/web-app)

Try one of these names, or use `/wave-threads` to see all threads.
```

## Special Cases

- If argument is empty, show a list of available threads
- If multiple threads match, show all matches with a disambiguation prompt
- Include task file locations for reference
