---
allowed-tools: Read, Bash, Write, Glob
description: Snapshot current test pass/fail state before making changes - detects regressions
---
# Test Baseline Snapshot

Capture current state of all test suites BEFORE making code changes.
This baseline detects regressions after your changes.

Arguments: $ARGUMENTS (optional: "unit", "e2e", "backend", or blank for all)

## Step 1: Detect project layout and run tests

```bash
# Source project config if available
. ".claude/config.sh" 2>/dev/null || true

echo "Git: $(git rev-parse --short HEAD) on $(git branch --show-current)"
```

## Step 2: Run test suite and capture results

Run the configured test command (from .claude/config.sh or default):

```bash
# Use TEST_COMMAND from config, or default to npm test
${TEST_COMMAND:-npm test} 2>&1 | tee test-output.log
```

## Step 3: Create test-baseline.json

```json
{
  "timestamp": "ISO-8601",
  "git_commit": "abc1234",
  "git_branch": "feature/xyz",
  "suites": {
    "unit": {
      "total": 150, "passed": 147, "failed": 3, "skipped": 0,
      "failing_tests": ["test name 1", "test name 2", "test name 3"]
    },
    "e2e": {
      "total": 42, "passed": 37, "failed": 5, "skipped": 0,
      "failing_tests": ["file::test1", "file::test2"]
    }
  }
}
```

## Step 4: Print summary

```
TEST BASELINE (commit abc1234 on feature/xyz)
=============================================
Unit:     147/150 passed (3 failed)
E2E:      37/42 passed  (5 failed)
=============================================
Total pre-existing failures: 8
Saved to test-baseline.json

These 8 failures exist BEFORE your changes.
After your changes, any NEWLY failing test = YOUR regression.
Fix regressions BEFORE continuing other work.
```

## After making changes

Compare against baseline:
```bash
# Quick check: run tests again and compare
# Parse test output and compare failing_tests against baseline
```
