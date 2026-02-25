---
allowed-tools: Read, Grep, Glob, Bash, Edit, MultiEdit, Write
description: Investigate test failures individually with full root cause analysis
---
# Test Failure Investigation Protocol

Run the test suite specified: $ARGUMENTS

If no arguments given, detect and run all suites:

```bash
# Source project config if available
. ".claude/config.sh" 2>/dev/null || true

# Run test command and capture output
${TEST_COMMAND:-npm test} 2>&1 | tee test-output.log
```

## Step 1: Create test-failures.json

Populate with EVERY failing test from ALL suites:

```json
{
  "suite": "all",
  "timestamp": "ISO-8601",
  "command": "what was run",
  "failures": [
    {
      "id": 1,
      "test": "exact test name from output",
      "file": "path/to/test.spec.ts",
      "error": "exact error message (first 500 chars)",
      "category": null,
      "evidence": null,
      "root_cause": null,
      "fix_applied": null,
      "fix_file": null,
      "verified": false
    }
  ],
  "total": 0,
  "investigated": 0,
  "fixed": 0
}
```

## Step 2: Process EACH failure individually

For every entry where `category` is null:

### 2a. Read the test code
Read the complete test function. What behavior does it verify?

### 2b. Read the code under test
Read the implementation. What does it actually do?

### 2c. Check git history
```bash
git log --oneline -5 -- <test_file> <source_file>
```
Did either file change recently? Who changed it?

### 2d. Classify
- A = App bug (test correct, app wrong)
- B = Test bug (app correct, test wrong - stale selectors, wrong mock, outdated model)
- C = Environment (auth credentials, service down, port conflict)

Record classification + evidence in the JSON entry.

### 2e. Fix the correct target
- A -> Fix app code. Do NOT touch the test.
- B -> Fix the test. Document what was wrong.
- C -> Fix environment. Document what was missing.

### 2f. Verify in isolation
```bash
# Run single test (adapt for your framework)
${TEST_SINGLE_COMMAND:-npm test} -- --grep "<test name>"
```

### 2g. Update tracker
Set `category`, `evidence`, `root_cause`, `fix_applied`, `fix_file`, `verified: true`.
Increment `investigated` and `fixed` counters.

### 2h. Move to next failure - no batching

## Step 3: Full regression check

After ALL individual fixes, run the complete suite again.
Any NEW failures = regressions you just introduced. Investigate those too.

## Rules

- ONE AT A TIME. No batching. No generalizing.
- The failure count does not affect thoroughness. 200 = 200 investigations.
- Track everything in test-failures.json. It's your source of truth.
- You cannot stop until `investigated == total`.
