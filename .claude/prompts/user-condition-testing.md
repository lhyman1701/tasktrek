# User Condition Testing Protocol (T-001 to T-013)

Tests must cover ALL user conditions, not just code paths.

## What is a User Condition?

The state a user is in when they arrive:

| Code | Name | Description |
|------|------|-------------|
| UC-NEW | New User | User with no prior data in the system |
| UC-RET | Returning User | User with existing data (conversations, items, etc.) |

## SECA Protocol

Before writing ANY test:
1. **S** - State Inventory: List all user conditions that can exist
2. **E** - Enumerate: Map each condition to a test case
3. **C** - Confirm: Verify all conditions are covered
4. **A** - Act: Write tests for each condition

## Rules Summary

| Rule | Requirement |
|------|-------------|
| T-001 | Every feature needs UC-NEW AND UC-RET tests |
| T-002 | UC-RET tests must NOT create data during test |
| T-003 | All conditions tracked in coverage-registry.yaml |
| T-004 | CI blocks if any condition lacks passing test |
| T-005 | Complete SECA protocol before any test implementation |
| T-006 | Verify each enumerated condition has test |
| T-010 | Never create test suite covering only ONE condition |
| T-011 | Never skip enumeration phase |
| T-012 | Never claim "exhaustive testing" without ALL conditions tested |
| T-013 | "User perspective" means conditions + actions |

## UC-RET Test Requirements

**FORBIDDEN:**
```typescript
// Creates data, then tests - this is UC-NEW disguised
test('[UC-RET] returning user', async () => {
  await createItem(); // NO! This makes it a new user test
  await page.goto('/items');
});
```

**REQUIRED:**
```typescript
// Uses genuinely pre-existing data
// @condition UC-RET
test('[UC-RET] returning user sees existing items', async () => {
  await loginAs(TEST_USERS.returning); // Has existing items
  await page.goto('/items');
  await expect(page.locator('[data-testid="item-list"]'))
    .toContainText(/item/i);
});
```

## Reference Documents

| Document | Purpose |
|----------|---------|
| `.claude/prompts/IMPLEMENTATION-PROMPTS.md` | Step-by-step implementation |
| `.claude/templates/returning-user-test-template.md` | Test templates |

## Verification Command

```bash
.claude/hooks/verify-condition-coverage.sh
```
