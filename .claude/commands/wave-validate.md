# Wave Validate Command

Check structural consistency of the wave system configuration.

## Instructions

Perform a comprehensive validation of all wave-related files to ensure consistency and correctness.

## Files to Read

1. **`.wave-config.json`** - Master wave configuration
2. **All `waves/wave-*.md` files** - Wave specifications
3. **All `tasks/*.md` files** - Task specifications
4. **All `progress/wave-*-status.md` files** - Progress tracking

## Validation Checks

### 1. Wave Configuration Completeness

- [ ] Every wave in `.wave-config.json` has a corresponding spec file in `waves/`
- [ ] Every wave in `.wave-config.json` has a corresponding progress file in `progress/`
- [ ] All required fields are present (id, name, tasks, depends_on)

### 2. Task Assignment Consistency

- [ ] Every task in `.wave-config.json` has a task file in `tasks/`
- [ ] No task appears in multiple waves
- [ ] No orphaned task files (tasks not assigned to any wave)
- [ ] Subtasks are properly nested under parent tasks

### 3. Dependency Validation

- [ ] All `depends_on` references point to existing waves
- [ ] No circular dependencies exist
- [ ] Dependency order matches wave order (lower waves don't depend on higher)

### 4. Task File Consistency

- [ ] Task files contain valid metadata (if using `**WAVE**` header)
- [ ] Task `**WAVE**` headers align with `.wave-config.json` assignments
- [ ] Task priorities are consistent (P0 > P1 > P2 > P3)

### 5. Progress File Consistency

- [ ] Progress files track all tasks from their wave
- [ ] Status values are valid (Pending/In Progress/Complete/Blocked)
- [ ] No tasks marked complete that aren't in the wave

## Output Format

```
# Wave System Validation Report

**Validated:** {timestamp}
**Result:** {PASS / FAIL / WARNINGS}

---

## Summary

| Check Category | Status | Issues |
|----------------|--------|--------|
| Wave Configuration | PASS | 0 |
| Task Assignment | PASS | 0 |
| Dependencies | PASS | 0 |
| Task Files | WARN | 2 |
| Progress Files | PASS | 0 |

---

## Detailed Results

### Wave Configuration Completeness

| Wave | Spec File | Progress File | Status |
|------|-----------|---------------|--------|
| 001 | waves/wave-001-critical-path.md | progress/wave-001-status.md | OK |

### Task Assignment

| Task | Wave | Task File | Status |
|------|------|-----------|--------|
| TASK-001 | 001 | tasks/TASK-001.md | OK |

### Dependency Graph

```
001 (Critical Path)
  └─→ 002 (Next Phase)
        └─→ 003 (Final Phase)
```

No circular dependencies detected.

---

## Issues Found

### Errors (Must Fix)

| ID | Category | Description | Location |
|----|----------|-------------|----------|
| E001 | Task Assignment | Task X not found in any wave | .wave-config.json |

### Warnings (Should Review)

| ID | Category | Description | Location |
|----|----------|-------------|----------|
| W001 | Task File | Missing **WAVE** header | tasks/TASK-001.md |

---

## Recommendations

1. {Fix for error 1}
2. {Fix for warning 1}

---

## Validation Complete

Run `/wave-validate` again after making corrections.
```

## Error Severity Levels

- **ERROR**: Structural issue that will cause wave execution to fail
- **WARNING**: Inconsistency that should be reviewed but won't block execution
- **INFO**: Suggestion for improvement (optional)

## Special Cases

- If files are missing, report but continue validation
- If JSON is malformed, report and skip dependent checks
- Be conservative: flag potential issues even if uncertain
