# Workflow Gates

This document describes the quality gates enforced by TaskTrek hooks and commands.

## Gate Types

### 1. Pre-Edit Gate

**Hook:** `pre-edit-check.sh`
**Trigger:** Before Write or Edit operations

**Checks:**
- Reminds about active wave alignment
- Prompts for plan/test existence

**Bypass:** None (informational only)

---

### 2. Test Failure Classification Gate

**Hook:** `test-failure-classifier.sh`
**Trigger:** Before editing test files

**Checks:**
- Test file has entry in `test-failures.json`
- Failure is classified (A/B/C)
- Blocks edits to tests without classification

**Bypass:** Remove entry from `test-failures.json` after fixing

---

### 3. Pre-Commit Test Gate

**Hook:** `pre-commit-test-gate.sh`
**Trigger:** Before `git commit` or `git push`

**Checks:**
- No uninvestigated test failures
- Tests pass (if TEST_COMMAND configured)

**Bypass:** None (tests must pass)

---

### 4. Regression Detection Gate

**Hook:** `regression-detector.sh`
**Trigger:** After editing source files

**Checks:**
- Warns about related test files
- Reminds about test baseline

**Bypass:** None (informational only)

---

### 5. Stop Gate

**Hook:** `stop-gate-testing.sh`
**Trigger:** On session stop

**Checks:**
- Uninvestigated failures
- Unfixed failures
- Uncommitted changes

**Bypass:** None (warnings only)

---

### 6. Condition Coverage Gate

**Script:** `verify-condition-coverage.sh`
**Trigger:** Manual or CI

**Checks:**
- UC-NEW tests exist
- UC-RET tests exist
- Coverage registry accurate

**Exit Code:** 1 if coverage incomplete

---

## CI Integration

Add to your CI workflow:

```yaml
name: Quality Gates

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Verify Condition Coverage
        run: .claude/hooks/verify-condition-coverage.sh

      - name: Run Tests
        run: $TEST_COMMAND

      - name: Check for Regressions
        run: |
          if [ -f test-baseline.json ]; then
            echo "Baseline exists, checking for regressions"
            # Compare current results to baseline
          fi
```

## Manual Verification

Run all gates manually:

```bash
# Check condition coverage
.claude/hooks/verify-condition-coverage.sh

# Check for uncommitted changes
git status --porcelain

# Check test failures
cat test-failures.json 2>/dev/null || echo "No failure tracker"

# Run quality check
.claude/hooks/quality-check.sh
```
