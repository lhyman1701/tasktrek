# Sync Incomplete Waves Command

Regenerate `docs/INCOMPLETE-WAVES-STATUS.md` from the current wave configuration and progress files.

## Purpose

This command ensures the incomplete waves status document is always in sync with the actual wave system state. Run this command:
- At the end of each session
- After completing any wave tasks
- After modifying `.wave-config.json`
- Before sharing project status with stakeholders

## Instructions

Execute the following steps to regenerate the incomplete waves status document:

### Step 1: Read Wave Configuration

```bash
cat .wave-config.json | jq '{
  total_waves: .total_waves,
  current_state: .current_state,
  waves: .waves | to_entries | map({
    id: .key,
    name: .value.name,
    description: .value.description,
    task_count: .value.task_count,
    depends_on: .value.depends_on,
    priority: .value.priority,
    estimated_hours: .value.estimated_hours
  })
}'
```

### Step 2: Read All Progress Files

For each wave in `.wave-config.json`, check for a progress file:

```bash
ls -la progress/wave-*.md
```

Read each progress file and extract:
- Status (COMPLETE, IN PROGRESS, PENDING, BLOCKED, NOT STARTED)
- Completed task count
- Total task count
- Remaining tasks with descriptions

### Step 3: Categorize Waves

Group waves into these categories based on `current_state`:

| Category | Source |
|----------|--------|
| COMPLETED | `current_state.completed_waves` |
| IN PROGRESS | `current_state.in_progress_waves` |
| BLOCKED | `current_state.blocked_waves` |
| READY | `current_state.ready_waves` |
| NOT STARTED | Waves not in any of the above |

### Step 4: Calculate Metrics

For each incomplete wave, calculate:
- Completion percentage: `(completed_tasks / total_tasks) * 100`
- Estimated hours remaining: `estimated_hours * (1 - completion_percentage)`
- Critical blockers (waves that block other high-priority waves)

### Step 5: Generate Document

Write the following structure to `docs/INCOMPLETE-WAVES-STATUS.md`:

```markdown
# Incomplete Waves Status Report

**Generated:** {TODAY'S DATE in YYYY-MM-DD format}
**Total Waves Defined:** {total_waves from config}
**Completed Waves:** {count of completed_waves}
**Incomplete Waves:** {count of non-completed waves}

---

## Executive Summary

| Category | Count | Hours Est. |
|----------|-------|------------|
| BLOCKED | X | Xh |
| READY | X | Xh |
| IN PROGRESS | X | ~Xh remaining |
| NOT STARTED | X | Xh |
| **Total Remaining** | **X** | **~Xh** |

### Critical Blockers
{List waves that are blocking other high-priority waves}

### Immediate Priorities
{List top 3 waves that should be worked on next, based on priority and completion %}

---

## Quick Reference

| Wave | Name | Status | Tasks | Completion | Priority | Est. Hours |
|------|------|--------|-------|------------|----------|------------|
{For each incomplete wave, one row with summary data}

---

## Detailed Wave Analysis

{For each incomplete wave, generate a detailed section:}

### Wave {ID}: {Name}
**Status:** {STATUS}
**Completion:** {X/Y} tasks ({Z}%)
**Priority:** {priority}
**Estimated Effort:** {hours}h

#### Description
{description from wave config}

#### Dependencies
- Depends on: {list of depends_on waves with their status}

#### Remaining Tasks

| Task ID | Description | Est. Hours | Can Parallel |
|---------|-------------|------------|--------------|
{List each incomplete task}

#### Notes
{Any relevant notes about the wave's status or blockers}

---

## Dependency Graph

{ASCII visualization of wave dependencies}

---

## Recommended Execution Order

Based on dependencies and priorities:

1. {Wave ID} - {Name} ({reason})
2. {Wave ID} - {Name} ({reason})
3. {Wave ID} - {Name} ({reason})
...

## Parallelization Opportunities

Waves that can be worked on simultaneously:
- Track A: {Wave IDs}
- Track B: {Wave IDs}
```

### Step 6: Verify and Log

After writing the document:

1. Verify the file was written correctly
2. Log the action via session-audit:
   ```
   mcp__session-audit__log_action:
     type: "file_write"
     description: "Regenerated docs/INCOMPLETE-WAVES-STATUS.md - X incomplete waves documented"
     file_path: "docs/INCOMPLETE-WAVES-STATUS.md"
   ```

## Output

After completion, provide a summary:

```
docs/INCOMPLETE-WAVES-STATUS.md regenerated successfully.

Summary:
- Total Waves: X
- Completed: X (Y%)
- In Progress: X
- Blocked: X
- Ready: X
- Not Started: X

Top 3 Priorities:
1. Wave XXX - {Name}
2. Wave XXX - {Name}
3. Wave XXX - {Name}
```

## Integration Points

This command should be automatically invoked by:
- `/end-session` command (before committing)
- `/wave-validate` command (after validation)
- Manually when wave status changes significantly

## Data Sources

| Data | Source |
|------|--------|
| Wave definitions | `.wave-config.json` |
| Wave progress | `progress/wave-*-status.md` |
| Task details | `tasks/*.md` (if available) |
| Completion state | `.wave-config.json` → `current_state` |

## Error Handling

- If a wave has no progress file, create a minimal entry based on `.wave-config.json`
- If progress file is out of sync with config, note the discrepancy
- If estimated_hours is missing, use task_count * 2 as default estimate
