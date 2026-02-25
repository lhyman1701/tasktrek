# Commit Work Command

Create a quality-checked commit for work in progress.

## Pre-Commit Quality Checks

Before committing, verify:

### 1. Review Changes
```bash
git status
git diff --stat
```
- Summarize what changed and why
- Confirm changes align with plan/task

### 2. Run Tests
- Execute test suite if changes warrant it
- Verify all tests pass
- Check no new warnings

### 3. Code Quality
- Ensure code follows project conventions
- Verify no debug code or console.logs
- Check error handling is appropriate

### 4. Wave Progress Update (IMPORTANT)

If completing a task or subtask:

1. **Read active wave**: Check `.wave-config.json` for `current_state.active_wave`
2. **Update progress file**: `progress/wave-{ID}-status.md`
   - Mark completed tasks/subtasks
   - Update completion percentage
   - Add timeline entry
3. **Check wave completion**: If all tasks done, prepare to update:
   - Wave status to `complete`
   - `.wave-config.json` current_state

### 5. Documentation Updates
- Update relevant task file progress
- Update ROADMAP.md if task completes
- Note any decisions made

## Commit Message Format

```
type(scope): subject line

- Detailed point 1
- Detailed point 2

Wave: {wave_id} - {wave_name}
Task: {task_id}

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types
- `feat`: New feature or functionality
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Example
```
feat(observability): complete TASK-001f structured logging

- Migrated 6 task files to structured logging
- Added correlation IDs for tracing
- Standardized log levels across all tasks

Wave: 001 - Critical Path
Task: TASK-001f

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Commit Checklist

Before executing `git commit`:

- [ ] Changes reviewed and understood
- [ ] Tests pass (if applicable)
- [ ] No debug code left in
- [ ] Wave progress file updated (if task/subtask complete)
- [ ] Task file updated (if applicable)
- [ ] Commit message follows format

## After Commit

If this completes a wave task:
1. Verify wave progress file is accurate
2. Check if wave is now complete
3. If wave complete, update `.wave-config.json`
4. Consider running `/wave-status` to verify

Show the proposed commit message and wait for approval before executing `git commit`.
