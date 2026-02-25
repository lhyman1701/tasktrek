# Wave Threads Command

Show thread/agent-level view for the current active wave.

## Instructions

Identify the current active wave and show task groupings by module/thread.

## Files to Read

1. **`.wave-config.json`** - Get active wave from `current_state.active_wave`
2. **`waves/wave-{ID}-*.md`** - Wave specification with modules and tasks
3. **`progress/wave-{ID}-status.md`** - Current progress for the active wave

## Analysis Steps

1. **Identify Active Wave**
   - Check `.wave-config.json` for `current_state.active_wave`
   - If not set, find the lowest wave ID that has incomplete tasks and satisfied dependencies

2. **Read Wave Specification**
   - Open the wave spec file (e.g., `waves/wave-001-critical-path.md`)
   - Extract modules and task assignments

3. **Group Tasks into Threads**
   - Group tasks by their primary module or ownership
   - Use the `modules` array from `.wave-config.json` as hints

4. **Determine Thread Status**
   - **Idle**: No tasks started in this thread
   - **In Progress**: At least one task active
   - **Complete**: All tasks in thread done
   - **At Risk**: Task has been in progress too long or has notes indicating issues
   - **Blocked**: Waiting on another thread or external dependency

## Output Format

```
## Wave {ID}: {Name}

**Status:** In Progress | **Tasks:** X/Y complete | **Est. Hours:** Z

### Threads

| Thread | Modules | Tasks | Progress | Status | Notes |
|--------|---------|-------|----------|--------|-------|
| Thread 1 | module-a, module-b | TASK-001a, TASK-001b | 2/2 | Complete | All done |
| Thread 2 | module-c | TASK-001c, TASK-001d | 1/2 | In Progress | Working |
| Thread 3 | module-d | TASK-001e | 0/1 | Pending | Blocked by Thread 2 |
```

### Key for Status

- **Complete**: All thread tasks done
- **In Progress**: Active work happening
- **Pending**: Not started, ready to begin
- **At Risk**: Potential issues flagged
- **Blocked**: Cannot proceed until dependency resolved

## Special Cases

- If threads cannot be inferred from modules, treat each task as its own thread
- If a task spans multiple modules, assign it to a "Cross-Cutting" thread
- Include any risk flags or warnings from the progress file
