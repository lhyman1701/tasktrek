# Wave Status Command

Show high-level status of all waves and overall project progress.

## Instructions

Read the following files to determine wave status:

1. **`.wave-config.json`** - Wave definitions, dependencies, and current state
2. **All `progress/wave-*-status.md` files** - Progress tracking for each wave

## Analysis Steps

1. **Parse Wave Configuration**
   - Load `.wave-config.json`
   - Extract wave list with IDs, names, task counts, dependencies
   - Note the `current_state.active_wave` field

2. **Determine Status for Each Wave**
   - Read each `progress/wave-{ID}-status.md` file
   - Count completed tasks vs total tasks
   - Determine status:
     - **Complete**: All tasks marked done
     - **In Progress**: Some tasks done, wave is active
     - **Pending**: No tasks started, dependencies met
     - **Blocked**: Dependencies not satisfied

3. **Check Dependencies**
   - For each wave, verify if `depends_on` waves are complete
   - Mark as blocked if any dependency is incomplete

4. **Calculate Overall Progress**
   - Sum completed tasks across all waves
   - Sum total tasks across all waves
   - Calculate percentage: `(completed / total) * 100`

## Output Format

Provide a table of all waves:

```
| Wave | Name | Tasks | Status | Dependencies |
|------|------|-------|--------|--------------|
| 001 | Critical Path | 2/2 | Complete | None |
| 002 | Security | 0/3 | Pending | 001 (Complete) |
| 003 | Quality | 0/3 | Blocked | 002 (Pending) |
```

Then provide a summary:

```
## Summary

**Overall Progress:** X/Y tasks complete (Z%)
**Current Active Wave:** Wave {ID} - {Name}
**Next Wave:** Wave {ID} - {Name}
**Blocking Issues:** {List any blockers or "None"}
```

## Special Cases

- If multiple waves show "In Progress", flag this as unusual
- If a wave has subtasks (like TASK-001a through TASK-001f), count those toward the parent task completion
- If no waves are active and all are blocked, identify the root cause
