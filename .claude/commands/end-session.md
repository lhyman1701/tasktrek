# End Session Command

Properly close a Claude Code session with full commit, sync, documentation, and continuity handoff.

## CRITICAL: Session Audit Protocol

**Every session MUST use the MCP session-audit server to log activity and close the session.**

---

## Instructions

Execute ALL steps in order. Do not skip any step.

---

## Phase -1: CHECK FOR UNEXECUTED PLANS (MANDATORY)

**Only check PROJECT-LOCAL plans. NEVER read ~/.claude/plans/ (global directory).**

```bash
# Check PROJECT-LOCAL plans only
find .claude/plans/ -name "*.md" -mtime -1 -exec ls -la {} \; 2>/dev/null
```

**For EACH recent plan file found in .claude/plans/:**

1. Read the plan file
2. Determine if the plan was executed or not
3. **If plan was NOT executed**, add to incomplete work:
```
mark_incomplete:
  task_id: "PLAN-<plan-name>"
  description: "Plan created but not executed: <brief description>"
  priority: "high"
  reason: "Session ended before plan execution"
```

---

## Phase 0: End MCP Audit Session (MANDATORY)

**Use the session-audit MCP server to record session completion:**

```
mcp__session-audit__end_session:
  summary: "Brief description of what was accomplished this session"
  incomplete_work:
    - task_id: "{TASK_ID}"
      description: "What remains to be done"
      priority: "critical|high|medium|low"
      reason: "Why it wasn't completed"
```

**IMPORTANT:**
- List ALL incomplete work with accurate priorities
- Be brutally honest - do NOT minimize or gloss over unfinished tasks
- The `summary` should capture the key accomplishments
- Each `incomplete_work` item will be surfaced at the start of the next session

---

## Phase 1: Work Summary

Before closing, create a complete summary of this session:

1. **List All Changes Made**
   - Files created
   - Files modified
   - Configuration changes

2. **List Tasks Completed**
   - Task IDs and descriptions
   - Subtasks completed
   - Progress percentages

3. **List Decisions Made**
   - Architectural decisions
   - Implementation choices

4. **List Issues Discovered**
   - New bugs found
   - Technical debt identified

---

## Phase 2: Code Quality Check

Run quality checks before committing:

```bash
# Check for uncommitted changes
git status

# Check for any debugging artifacts (customize for your stack)
grep -r "console.log\|debugger\|TODO.*REMOVE" --include="*.js" --include="*.ts" src/ 2>/dev/null | head -20
```

---

## Phase 3: Wave System Updates (CRITICAL)

**Update wave progress files to reflect current state:**

### 3a. Identify Active Wave
Read `.wave-config.json` to get `current_state.active_wave`.

### 3b. Update Active Wave Progress File
Update `progress/wave-{ID}-status.md`:
- Update `**Last Updated:**` timestamp
- Update `**Wave Status:**` (in_progress, complete, pending)
- Update `**Completion:**` percentage
- Update task status table (not_started -> in_progress -> complete)
- Add timeline entries for completed tasks

### 3c. Check for Wave Completion
If all tasks in active wave are complete:
1. Set wave status to `complete`
2. Update `.wave-config.json`:
   - Move wave ID to `completed_waves` array
   - Set `active_wave` to next wave ID

---

## Phase 4: Documentation Updates

Update ALL relevant documentation:

### 4a. Task File Updates
For each task worked on in `tasks/*.md`:
- Mark completed checkboxes `[x]`
- Update status field
- Add completion notes

### 4b. Reference File Updates

- **ROADMAP.md** - Update if tasks completed
- **BUGS.md** - Update if bugs fixed or found
- **REFACTORS.md** - Update if refactors done

---

## Phase 5: SESSION_START.md Update (CRITICAL)

This is the most important step for continuity. Update SESSION_START.md with:

1. **Last Updated**: Today's date
2. **Last Commit**: The commit message about to be created
3. **Status**: Updated task counts and percentages
4. **START HERE Section**: Update to point to the NEXT task

**Template for next session context:**
```markdown
**Active Wave:** Wave {ID} - {Name}
**NEXT:** [Task ID] - [Brief description]. [Any context needed to continue].
```

---

## Phase 6: Commit and Push

### 6a. Stage Changes
```bash
git add -A
git status
```

### 6b. Create Commit
Use this format:
```
type(scope): subject line

- Change 1
- Change 2

Wave: {active_wave_id} - {wave_name}
Tasks: {completed task IDs}
Session: [Brief session summary]
Next: [What to work on next]

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 6c. Push to Remote
```bash
git push origin HEAD
```

---

## Phase 7: Session Handoff Verification

Before completing, verify:

1. [ ] All code changes committed
2. [ ] All changes pushed to remote
3. [ ] SESSION_START.md updated with next steps
4. [ ] **Wave progress files updated** (progress/wave-*.md)
5. [ ] **.wave-config.json current_state updated** (if wave completed)
6. [ ] Task files updated with progress
7. [ ] No uncommitted changes remain (`git status` shows clean)

---

## Phase 8: Final Summary

Provide a session closure summary:

```
=== SESSION COMPLETE ===

Commit: [commit hash] - [commit message]
Branch: [branch name]
Pushed: Yes/No

MCP Audit Status:
- Session ID: [from end_session response]
- Duration: [minutes from end_session response]
- Actions Logged: [count from end_session response]
- Decisions Logged: [count from end_session response]
- Incomplete Work Flagged: [count from end_session response]

Wave Status:
- Active Wave: {ID} - {Name} ({X/Y} tasks)
- Completed Waves: {list}
- Next Wave: {ID} - {Name}

Tasks Completed This Session:
- [Task ID]: [Description]

Next Session Should:
1. Run: /session-start to load MCP context and incomplete work
2. Start with: Wave {ID} - Task {ID} - [specific subtask]
3. Run: /wave-dashboard to verify state

Session closed. Run /session-start to begin next session.
```

---

## Quick Reference: What Gets Updated

| Resource | When to Update |
|----------|---------------|
| **MCP session-audit** | ALWAYS - Use `end_session` to close session |
| `SESSION_START.md` | ALWAYS - This is the continuity file |
| `progress/wave-*.md` | ALWAYS - Wave progress tracking |
| `.wave-config.json` | When waves complete or unblock |
| `tasks/*.md` | When working on that task |
| `CLAUDE.md` | Only for permanent project changes |
