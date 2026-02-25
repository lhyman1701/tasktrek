# Wave Next Command

Start the next unblocked wave in the project.

## Instructions

This is a **control command** that changes execution state, not just a reporting command.

## Files to Read

1. **`.wave-config.json`** - Wave definitions and dependencies
2. **`progress/wave-*-status.md`** - All progress files to determine completion

## Analysis Steps

1. **Determine Wave Completion Status**
   - Read each `progress/wave-{ID}-status.md`
   - Mark waves as complete if all tasks are done
   - Build a list of completed wave IDs

2. **Find Next Eligible Wave**
   - Iterate through waves in order (001, 002, 003, ...)
   - For each wave that is NOT complete:
     - Check its `depends_on` array
     - If ALL dependencies are in the completed list, this wave is eligible
   - Select the lowest-order eligible wave

3. **Start the Wave**
   - Read the wave's spec file `waves/wave-{ID}-*.md`
   - Update `.wave-config.json` to set `current_state.active_wave`
   - Prepare execution plan based on wave rules

## Output Format

### When a Wave Can Be Started

```
## Starting Wave {ID}: {Name}

**Reason:** Wave {prev_ID} is complete and all dependencies are satisfied.

### Wave Details

| Property | Value |
|----------|-------|
| Wave ID | {ID} |
| Name | {Name} |
| Tasks | {task count} |
| Estimated Hours | {hours} |
| Max Parallel | {max_parallel} |

### Tasks to Execute

| Task ID | Name | Priority |
|---------|------|----------|
| TASK-001 | First Task | P0 |
| TASK-002 | Second Task | P0 |

### Execution Plan

1. Tasks can run in parallel up to {max_parallel} at a time
2. Start with highest priority (P0) tasks
3. Update progress in `progress/wave-{ID}-status.md`

### Next Steps

Ready to begin. Which task would you like to start first?
- `/task-status TASK-001` - View task details
- `/agent-status {thread}` - View thread
```

### When No Wave Can Be Started

```
## No Wave Available

**Current State:**
- Active Wave: {ID} - {Name} (In Progress)
- Completed Waves: {list}

**Reason:** {explanation}

Options:
1. Continue working on Wave {active_ID}
2. Complete remaining tasks: {list of incomplete tasks}

Use `/wave-status` to see full wave overview.
```

### When All Waves Are Complete

```
## All Waves Complete!

Congratulations! All {N} waves have been completed.

**Summary:**
- Total Tasks: {count}
- Total Hours: {hours}
- Waves Completed: {list}

The project is ready for deployment or the next phase.
```

## Important Notes

- This command will update `.wave-config.json` to reflect the new active wave
- It respects the `enforce_dependencies` setting in global settings
- If a wave has `execution_mode: phased`, it will note phase requirements
- Always verify the previous wave is truly complete before starting next
