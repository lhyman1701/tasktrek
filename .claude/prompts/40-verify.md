# Verification Prompt - Complete Quality Check

Execute this before claiming any task complete.

## Execution Steps

### 1. Lint Check

```bash
$LINT_COMMAND 2>&1 | tee lint-output.txt
```

**Required**: Zero errors

### 2. Type Check

```bash
$TYPECHECK_COMMAND 2>&1 | tee type-output.txt
```

**Required**: Zero errors

### 3. Unit Tests with Coverage

```bash
$TEST_COMMAND -- --coverage 2>&1 | tee test-output.txt
```

**Required**: All pass, >=80% coverage

### 4. E2E Tests

```bash
$E2E_COMMAND 2>&1 | tee e2e-output.txt
```

**Required**: All pass, content assertions verified

### 5. Manual Verification

- [ ] Opened app in browser
- [ ] Performed user journey manually
- [ ] Captured screenshots
- [ ] Checked console for errors

## Output Format

```
## Verification Report - [DATE]

### Lint: [PASS/FAIL]
[paste summary]

### Types: [PASS/FAIL]
[paste summary]

### Unit Tests: [PASS/FAIL]
Tests: XX passed
Coverage: Lines XX% | Branches XX%

### E2E Tests: [PASS/FAIL]
Scenarios: XX passed
Content assertions: [list key ones]

### Manual Verification: [VERIFIED/SKIPPED]
Evidence: [screenshot links or description]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL STATUS: [VERIFIED/FAILED]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## If ANY Check Fails

1. DO NOT claim task complete
2. Fix the issue
3. Re-run verification
4. Show passing output
