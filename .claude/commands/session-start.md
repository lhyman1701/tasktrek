# Session Start Command

Initialize a new Claude Code session with full project context.

## CRITICAL: Session Continuity Protocol

**BEFORE summarizing status, you MUST:**
1. Use the MCP session-audit tools to get incomplete work from last session
2. Check wave progress files for tasks marked `not_started` or `in_progress`
3. **NEVER claim a phase or task is "COMPLETE" unless ALL subtasks show `complete` status**
4. **ALWAYS surface incomplete work prominently** - don't gloss over it

**Verification Rule:** Count actual `complete` vs `not_started` statuses in wave files. Do not trust summary text.

---

## Instructions

You are starting a new session on this project. Follow these steps to gather complete context:

### Step 0: Start MCP Audit Session (MANDATORY)

**Use the session-audit MCP server to start the session and retrieve context:**

```
# Start a new audit session - returns incomplete work from previous sessions
mcp__session-audit__start_session:
  project_path: "{{PROJECT_PATH}}"
  branch: <current git branch>

# If start_session fails due to existing active session, get context instead:
mcp__session-audit__get_session_context:
  recent_actions_limit: 20
  recent_decisions_limit: 10
```

**Look for in the response:**
- `incompleteWork` - Work left over from previous sessions (CRITICAL)
- `recommendation` - Priority-based recommendation for what to do first
- `recentActions` - What was done in the last session
- `recentDecisions` - Key decisions made

If incomplete work exists, **you must acknowledge it explicitly** before proceeding.

### Step 0.5: CHECK FOR UNEXECUTED PLANS (MANDATORY)

**Check if any plans were created in recent sessions but not executed:**

```bash
# List all plan files modified in the last 48 hours (PROJECT-LOCAL only)
find .claude/plans/ -name "*.md" -mtime -2 -exec ls -la {} \; 2>/dev/null
```

**For EACH recent plan file:**

1. Read the plan file
2. Check if the plan work was actually executed
3. **If plan was NOT executed, THIS IS YOUR FIRST PRIORITY**

### Step 1: Read Core Context Files (MANDATORY)

Read ALL these files in order - do not skip any:

1. **.claude/AUDIT_RULES.md** - Mandatory verification rules (READ THIS)
2. **SESSION_START.md** - Current project state, active sprint, next task
3. **CLAUDE.md** - Project conventions, architecture rules
4. **.claude/PROJECT_CONTEXT.md** - Complete project context

### Step 2: Check Wave System Status (MANDATORY)

Read wave configuration and progress:

1. **`.wave-config.json`** - Get active wave and completion state
2. **`progress/wave-{active}-status.md`** - Active wave progress details

Determine:
- Which wave is currently active (`current_state.active_wave`)
- Which waves are complete (`current_state.completed_waves`)
- Which waves are blocked (`current_state.blocked_waves`)
- Current task within the active wave

### Step 3: Identify Current Work

Based on SESSION_START.md and wave status, identify:
1. **Active Wave** - Which wave is in progress
2. **Current Sprint** - What phase we're in
3. **Active Task** - What task should be worked on next
4. **Blockers** - Any dependencies or blocking issues

### Step 4: Verify Task Completion Status (CRITICAL)

**Before summarizing, manually verify:**

1. Open the active wave progress file (`progress/wave-{ID}-status.md`)
2. Count tasks with `status: complete` - this is the TRUE completion count
3. List any tasks with `status: not_started` or `status: in_progress`
4. **If previous session marked something "COMPLETE" but subtasks remain incomplete, FLAG THIS**

### Step 5: Acknowledge Session Start

After gathering context, provide a summary:

```
Session initialized via MCP session-audit server and SESSION_START.md

## Incomplete Work from Last Session (from MCP)
[List incompleteWork items from start_session response - BE EXPLICIT]

## Current Status (Verified)
**Active Wave:** Wave {ID} - {Name} ({ACTUAL_COMPLETE}/{TOTAL} tasks)
**Incomplete in Active Wave:** [List task IDs that are not complete]
**Overall Status:** [X/Y total tasks complete (Z%)]

## MCP Recommendation
[Show the 'recommendation' field from get_session_context]

## Recommended Next Action
[What should be done first based on incomplete work]

Ready to continue. What would you like to work on?
```

**IMPORTANT:** If there is incomplete work from the previous session, the "Recommended Next Action" MUST be to complete that work first, not to start new work.

## Wave Commands Available

| Command | Purpose |
|---------|---------|
| `/wave-status` | High-level status of all waves |
| `/wave-dashboard` | Rich combined dashboard |
| `/wave-threads` | Current wave threads view |
| `/wave-next` | Start next unblocked wave |
| `/task-status {ID}` | View specific task status |
| `/wave-validate` | Check system consistency |

## Related Commands

| Command | When to Use |
|---------|-------------|
| `/next-task` | Get the next task from ROADMAP |
| `/plan-first` | Create implementation plan before coding |
| `/commit-work` | Review and commit changes mid-session |
| `/update-docs` | Update documentation after changes |
| `/end-session` | **ALWAYS run before ending session** |

## Important Reminder

Before ending any session, ALWAYS run `/end-session` to:
- Commit and push all changes
- Update SESSION_START.md for next session
- **Update wave progress files** (critical for continuity)
- Ensure perfect continuity for next session
