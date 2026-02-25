# Testing Protocol

This document describes the complete testing protocol enforced by TaskTrek.

## Core Principles

1. **TDD is mandatory** - Write tests before implementation
2. **App is broken by default** - Tests are correct until proven otherwise
3. **Evidence over assertion** - Show test output, not claims
4. **Content over visibility** - Assert actual values, not just presence

## Failure Classification

Before fixing ANY test failure, classify it:

| Category | Meaning | Fix Target |
|----------|---------|------------|
| **A** | App bug | Application code |
| **B** | Test bug | Test code |
| **C** | Environment | Config/setup |

### Decision Tree

```
TEST FAILS
    │
    ├─ Is app behavior correct? (manual verification)
    │   │
    │   ├─ NO → Category A → Fix app code
    │   │
    │   ├─ UNKNOWN → Default to A → Investigate more
    │   │
    │   └─ YES (with proof) → Category B → Fix test
    │
    └─ Is it auth/connection/timeout? → Category C → Fix environment
```

## Test Types

### Unit Tests

```bash
# Run all unit tests
$TEST_COMMAND

# Run specific test
$TEST_COMMAND -- --grep "test name"
```

**Requirements:**
- Minimum 3 assertions per test
- Cover happy path AND error cases
- 80%+ coverage on changed files

### E2E Tests

```bash
# Run all E2E tests
$E2E_COMMAND

# Run specific test file
$E2E_COMMAND -- tests/feature.spec.ts
```

**Requirements:**
- Content assertions (not just visibility)
- Both UC-NEW and UC-RET conditions
- Screenshots on failure

## User Condition Testing

Every feature needs tests for:

| Condition | Code | Description |
|-----------|------|-------------|
| New User | UC-NEW | User with no prior data |
| Returning User | UC-RET | User with existing data |

### UC-RET Test Rules

1. **DO NOT** create data during the test
2. **DO** use pre-existing test user data
3. **DO** verify existing data is visible

### Example

```typescript
// @condition UC-RET
test('[UC-RET] returning user sees history', async ({ page }) => {
  await loginAs(TEST_USERS.returning); // Has existing data
  await page.goto('/history');
  await expect(page.locator('[data-testid="history-list"]'))
    .toContainText(/previous item/i);
});
```

## Test Commands

| Command | Purpose |
|---------|---------|
| `/baseline-test` | Snapshot current pass/fail state |
| `/investigate-failures` | Process failures one by one |
| `/test-audit` | Audit coverage from user perspective |
| `/e2e-verify [feature]` | EXHAUST protocol for feature |

## Regression Prevention

1. Run `/baseline-test` before making changes
2. Run tests after changes
3. Any previously-passing test that now fails = regression
4. Fix regressions before continuing

## Evidence Requirements

Before claiming "done":

- [ ] All tests pass (show output)
- [ ] Manual verification completed (show screenshots)
- [ ] Coverage meets thresholds
- [ ] Both UC-NEW and UC-RET tested

## Forbidden Practices

- Changing tests to make them pass without Category B evidence
- Adding `.skip()` without documented reason
- Using `--no-verify` to bypass hooks
- Claiming "done" without test output
- Visibility-only assertions (`toBeVisible()` alone)
