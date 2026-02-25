# Wave Dashboard Command

Display a comprehensive dashboard combining global wave status and current wave thread details.

## Instructions

This is the go-to command for a complete project overview. Combine information from `/wave-status` and `/wave-threads` into one rich display.

## Files to Read

1. **`.wave-config.json`** - Wave definitions, dependencies, current state
2. **All `progress/wave-*-status.md` files** - Progress for each wave
3. **`waves/wave-{active}-*.md`** - Active wave specification

## Output Format

```
# Wave Dashboard

**Project:** {project name from .wave-config.json}
**Generated:** {current timestamp}
**Overall Progress:** X/Y tasks (Z%)

---

## Section 1: Wave Overview

| Wave | Name | Tasks | Hours | Status | Dependencies |
|------|------|-------|-------|--------|--------------|
| 001 | Critical Path | 2/2 | 16 | Complete | - |
| 002 | Security | 0/3 | 11 | **Active** | 001 |
| 003 | Quality | 0/3 | 15 | Pending | 002 |

**Legend:** Complete | **Active** | Pending | Blocked

---

## Section 2: Active Wave Threads

**Wave {ID}:** {Name}
**Progress:** X/Y tasks | **Est. Remaining:** Z hours

| Thread | Tasks | Progress | Status | Next Action |
|--------|-------|----------|--------|-------------|
| Thread 1 | TASK-001 | 0/1 | Pending | Start first step |
| Thread 2 | TASK-002 | 0/1 | Pending | Awaiting Thread 1 |

---

## Section 3: Risks & Blockers

### Current Blockers

| Issue | Impact | Wave | Resolution |
|-------|--------|------|------------|
| {description} | {severity} | {wave} | {suggested fix} |

*No blockers identified* (if none)

### At-Risk Items

| Item | Reason | Mitigation |
|------|--------|------------|
| {task or thread} | {why at risk} | {suggestion} |

*No items at risk* (if none)

---

## Section 4: Quick Actions

- `/wave-next` - Start next wave (if current complete)
- `/task-status {ID}` - View specific task
- `/agent-status {name}` - View thread details
- `/wave-validate` - Check system consistency

---

## Recent Activity

| Time | Action | Details |
|------|--------|---------|
| {timestamp} | {action} | {brief note} |

*Based on progress file entries*
```

## Analysis Requirements

1. **Calculate Overall Progress**
   - Count completed tasks across ALL waves
   - Calculate remaining hours

2. **Identify Active Wave**
   - Use `current_state.active_wave` from config
   - Show thread breakdown for active wave only

3. **Detect Risks and Blockers**
   - Look for notes containing "blocked", "risk", "error", "failed"
   - Check for stale in-progress tasks (no updates)
   - Check for dependency issues

4. **Extract Recent Activity**
   - Parse log/notes sections from active wave progress file
   - Show most recent 3-5 entries

## Special Cases

- If no wave is active, show "No active wave - run /wave-next to begin"
- If multiple waves appear active, flag this as a configuration issue
- Keep the dashboard compact - link to detailed commands for more info
