---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/test/**"
  - "**/tests/**"
  - "**/e2e/**"
  - "**/__tests__/**"
---
# Testing Rules (MANDATORY)

## Failure Classification Protocol

Before fixing ANY test failure, classify it:

| Category | Meaning | Fix Target | Evidence Required |
|----------|---------|------------|-------------------|
| **A** | App bug - test is correct, app is wrong | Application code | Test matches requirements; app produces wrong result |
| **B** | Test bug - app is correct, test is wrong | Test code | App behavior correct; test has stale selectors/assertions/mocks |
| **C** | Environment - auth/config/services issue | Config/environment | Error references connection/auth/timeout, not logic |

**State category (A/B/C) and evidence BEFORE writing any fix.**
**NEVER modify a test to make it pass without Category B evidence.**
**Auth errors are Category C until proven otherwise - check .env.test FIRST.**

---

## Evidence Gathering Checklist (MANDATORY before any fix)

- [ ] Copied the EXACT error message and stack trace
- [ ] Read the failing test code AND the code under test
- [ ] Checked git blame on both files - what changed recently?
- [ ] For auth errors: verified credentials from .env.test were used
- [ ] For E2E: checked if Playwright selectors match current DOM (data-testid)
- [ ] For unit: checked if mock handlers match current API contract
- [ ] Ran the test in isolation

---

## E2E Tests are Mandatory

Before ANY completion claim:
```bash
$E2E_COMMAND  # Run ALL tests, include FULL output
```

FORBIDDEN phrases:
- "Tests are probably passing"
- "I'll run tests later"
- "Tests should pass"
- "Let me skip tests for now"

---

## No Visibility-Only Assertions

FORBIDDEN - these prove nothing:
```typescript
expect(element).toBeVisible()
expect(locator).toBeEnabled()
expect(button).toBeInTheDocument()
await expect(page.locator('.item')).toBeVisible()
```

REQUIRED - assert actual content:
```typescript
expect(element).toContainText('Expected message content')
expect(response.data).toMatchObject({ status: 'success', count: 5 })
await expect(page.locator('.response')).toContainText('Expected content')
expect(mockApi).toHaveBeenCalledWith({ query: 'test' })
await expect(page).toHaveURL('/dashboard')
expect(store.getState().items).toHaveLength(3)
```

**Why:** A `.toBeVisible()` test passes even if the element shows wrong content.

---

## TDD is Mandatory

1. Write E2E test FIRST
2. Run test - MUST FAIL (proves test works)
3. Implement feature
4. Run test - MUST PASS
5. Only then claim "done"

Feature is NOT done until:
- [ ] E2E test exists
- [ ] Test failed before implementation
- [ ] Test passes after implementation
- [ ] Test asserts actual content/behavior (not just visibility)

---

## Test Failure = App Bug (Default Assumption)

**THE APPLICATION IS BROKEN, NOT THE TEST.**

Before modifying ANY failing test, REQUIRE:
1. Manual verification that app behavior is actually correct
2. Screenshot/evidence PROVING app works correctly
3. Documented justification for why the test expectation was wrong
4. Commit message explaining the justification

FORBIDDEN actions:
- Changing test assertions to match broken app behavior
- Weakening tests (removing assertions) to make them pass
- Changing expected values without proving app is correct
- Adding .skip() without documented reason
- Adding waitForTimeout to "fix" race conditions
- Commenting out failing assertions
- Catching and ignoring errors in tests

---

## Test Modification Decision Tree

```
TEST FAILS
    |
    v
Is the app behavior CORRECT? (verify manually with evidence)
    |
    +-- NO (app broken) --> FIX THE APP CODE, not the test
    |
    +-- UNKNOWN --> STOP. Verify manually. Default: APP IS BROKEN
    |
    +-- YES (documented proof) --> Fix test with:
        1. Screenshot proving app works
        2. Explanation of why test was wrong
        3. Commit message with justification
```

---

## Tests Must Fail Against Broken Code

Every new test MUST be PROVEN to fail before the fix/feature is implemented.

Required protocol:
1. Write the test FIRST
2. Run it - MUST FAIL (if it passes, test is defective)
3. Document the failure (screenshot/error output)
4. Implement the fix/feature
5. Run it - MUST PASS
6. Document the pass (screenshot/test output)

Test quality requirements:
- Test MUST fail if expected functionality is missing
- Test MUST fail if wrong data is returned
- Test MUST fail if error occurs
- Test MUST check actual content/values, not just presence
- Test MUST catch regressions if code changes

---

## Mandatory Manual Verification Before "Healthy" Status

FORBIDDEN: Declaring any feature "healthy", "working", "functional", or "passing" based solely on test results.

**Tests passing != Feature working.** Tests can pass against broken code.

Required verification protocol:
1. Open application in real/headed browser (not headless test)
2. Perform the user journey manually as a real user would
3. Capture screenshots at every step
4. Capture console errors and network requests
5. Document in verification file with evidence
6. Only then can feature be declared healthy

---

## User Perspective is the Only Perspective

FORBIDDEN: Technical-only verification.

Technical verification is NOT user verification:
- "Page loads" != "User can use it"
- "No console errors" != "User can accomplish task"
- "API returns 200" != "User sees the result"
- "Element is visible" != "User gets value from it"
- "Test passes" != "Feature works for humans"

Before claiming anything works, ask:
1. Can a real person accomplish the task?
2. Would they know what to do?
3. Would they see the expected result?
4. Would THEY say "this works"?

If any answer is NO -> IT'S BROKEN

---

## User Condition Testing Protocol

Tests must cover ALL user conditions: UC-NEW (new user) AND UC-RET (returning user with existing data).

Key Rules:
- T-001: Every feature needs BOTH UC-NEW and UC-RET tests
- T-002: UC-RET tests must NOT create data during test (use pre-existing)
- T-010: Never create test suite covering only ONE condition

Full protocol: `.claude/prompts/user-condition-testing.md`
Verification: `.claude/hooks/verify-condition-coverage.sh`

---

## Individual Failure Investigation Protocol

When multiple tests fail:
1. Run suite - capture ALL failures into `test-failures.json`
2. Process EACH failure: read test, read source, classify, fix, verify
3. ONE AT A TIME - no batching, no generalizing
4. After all fixes - full suite regression check

**200 failures = 200 investigations. Scale is irrelevant.**

---

## Regression Prevention

1. Run `/baseline-test` before changes - saves pass/fail to `test-baseline.json`
2. Previously-passing test that now fails = YOUR regression
3. Fix regressions BEFORE continuing
4. Pre-commit hook blocks commit if tests fail

---

## Test Commands

Configure these in `.claude/config.sh`:

| Variable | Purpose |
|----------|---------|
| `TEST_COMMAND` | Unit test command (e.g., `npm test`) |
| `E2E_COMMAND` | E2E test command (e.g., `npm run test:e2e`) |
| `LINT_COMMAND` | Lint command (e.g., `npm run lint`) |

Slash commands:
| Command | Purpose |
|---------|---------|
| `/investigate-failures` | Create tracker, investigate each failure |
| `/baseline-test` | Snapshot pass/fail state |
| `/test-audit` | Audit coverage from user perspective |
