# Task Status Command

Show live status for a specific task by ID.

## Usage

```
/task-status $ARGUMENTS
```

Where `$ARGUMENTS` is the task ID (with or without prefix).

**Examples:**
- `/task-status TASK-001`
- `/task-status TASK-001a`
- `/task-status 001` (will try to find matching task)

## Files to Read

1. **`.wave-config.json`** - Find which wave contains this task
2. **`tasks/{task-id}*.md`** - Task specification file
3. **`progress/wave-{ID}-status.md`** - Progress for the task's wave

## Analysis Steps

1. **Normalize Task ID**
   - If `$ARGUMENTS` is just a number, try common prefixes
   - Normalize to uppercase

2. **Find Task's Wave**
   - Search `.wave-config.json` for the wave containing this task
   - Check the `tasks` array in each wave definition
   - Also check `subtasks` for parent task references

3. **Read Task File**
   - Look for `tasks/{task-id}*.md`
   - Extract: name, description, dependencies, acceptance criteria

4. **Get Current Status**
   - Read the wave's progress file
   - Find the task's status entry
   - Extract any notes or error messages

## Output Format

```
## Task: {Task ID}

**Name:** {Task name from task file}
**Wave:** {Wave ID} - {Wave Name}
**Status:** {Pending/In Progress/Complete/Blocked}
**Priority:** {P0/P1/P2/P3}
**Estimated Hours:** {X}

### Description

{Brief description from task file}

### Dependencies

| Dependency | Status |
|------------|--------|
| TASK-001 | Complete |
| Wave 001 | Complete |

### Progress Notes

{Any notes from progress file}

### Files Touched

- `{file path}` - {brief note}
- `{file path}` - {brief note}

### Acceptance Criteria

- [ ] {criterion 1}
- [x] {criterion 2 - if complete}

### Subtasks (if applicable)

| Subtask | Status |
|---------|--------|
| TASK-001a | Complete |
| TASK-001b | Complete |
| TASK-001c | In Progress |
```

## Handling Invalid Task ID

If `$ARGUMENTS` doesn't match any known task:

```
## Task Not Found

Could not find task "{$ARGUMENTS}".

**Did you mean one of these?**
- TASK-001 - First Task
- TASK-002 - Second Task

**Tip:** Use the full task ID (e.g., "TASK-001", not just "001").
```

## Special Cases

- For parent tasks with subtasks, show rollup status
- If task file doesn't exist, report what's known from wave config
- Handle hyphenated vs non-hyphenated IDs gracefully
- If multiple matches exist (unlikely), show disambiguation
