# Wave Log Command

Show recent activity history for the current active wave.

## Instructions

Display a chronological log of events, completions, and notes from the current wave's progress file.

## Files to Read

1. **`.wave-config.json`** - Get active wave from `current_state.active_wave`
2. **`progress/wave-{ID}-status.md`** - Progress file with activity log

## Analysis Steps

1. **Identify Active Wave**
   - Read `current_state.active_wave` from `.wave-config.json`
   - If not set, find the wave with most recent activity

2. **Parse Progress File**
   - Look for log/history sections (often at the bottom)
   - Extract dated entries or status transitions
   - Identify recent task completions
   - Find error messages or retries
   - Note any decision points or significant changes

3. **Build Chronological View**
   - Sort entries by timestamp (if available) or order in file
   - Group related entries (e.g., all updates for one task)
   - Highlight important events (completions, errors, blockers)

## Output Format

```
# Wave Log: Wave {ID} - {Name}

**Status:** {In Progress/Complete}
**Last Updated:** {timestamp or "Unknown"}

---

## Recent Activity

### {Date/Time if available}

| Time | Event | Details |
|------|-------|---------|
| 14:30 | Task Complete | TASK-001f - Final subtask |
| 14:15 | Subtask Complete | TASK-001e - Previous subtask |
| 13:45 | Started | TASK-001e - Working on it |

---

## Task Transitions

| Task | Previous | Current | Changed |
|------|----------|---------|---------|
| TASK-001a | In Progress | Complete | Dec 25, 2024 |
| TASK-001b | Pending | Complete | Dec 25, 2024 |

---

## Errors & Retries

| Task | Issue | Resolution | Status |
|------|-------|------------|--------|
| {task} | {error description} | {what was done} | {resolved/pending} |

*No errors recorded* (if none)

---

## Notes & Decisions

- **{date}**: {decision or note}
- **{date}**: {another note}

---

## Summary

**Completed This Session:** {N} tasks
**In Progress:** {N} tasks
**Pending:** {N} tasks
**Blockers:** {None or list}

---

## Quick Actions

- `/task-status {ID}` - View specific task details
- `/wave-threads` - View thread breakdown
- `/wave-dashboard` - Full dashboard view
```

## Parsing Log Content

Look for these patterns in progress files:

1. **Dated headers**: `### December 25, 2024` or `## 2024-12-25`
2. **Timestamp prefixes**: `[14:30]`, `14:30:`, `2024-12-25T14:30:00`
3. **Status markers**: `- [x]` (complete), `- [ ]` (pending), `DONE`, `COMPLETE`
4. **Error indicators**: `ERROR:`, `FAILED:`, `BLOCKED:`, `ISSUE:`
5. **Note sections**: `### Notes`, `## Log`, `### Activity`

## Special Cases

- If no log section exists, construct history from task status changes
- If timestamps aren't available, show entries in file order
- Include any git commit references if found in notes
- If wave is complete, show final summary of the wave
