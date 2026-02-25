# Returning User Test Template

Use this template when writing tests for the UC-RET (returning user) condition.

## Key Principle

A returning user test must:
1. Use PRE-EXISTING data (not create it during the test)
2. Test behavior with data already in the system
3. Verify the user sees their previous data

## Template

```typescript
// @condition UC-RET
test('[UC-RET] returning user sees their existing [items]', async ({ page }) => {
  // ARRANGE
  // Login as a user who has existing data
  // DO NOT create data here - that would make this a UC-NEW test
  await loginAs(TEST_USERS.returning);

  // ACT
  // Navigate to the feature
  await page.goto('/feature');

  // ASSERT
  // Verify pre-existing data is visible
  await expect(page.locator('[data-testid="item-list"]'))
    .toContainText(/existing item/i);

  // Verify count or specific items
  await expect(page.locator('[data-testid="item-count"]'))
    .toHaveText(/\d+ items/);

  // Verify user can interact with existing data
  await page.click('[data-testid="first-item"]');
  await expect(page.locator('[data-testid="item-details"]'))
    .toBeVisible();
});
```

## Anti-Pattern (WRONG)

```typescript
// This is WRONG - creates data, making it UC-NEW disguised as UC-RET
test('[UC-RET] returning user', async ({ page }) => {
  // WRONG: Creating data makes this a UC-NEW test
  await createItem({ name: 'Test Item' });

  await page.goto('/items');
  await expect(page.locator('[data-testid="item-list"]'))
    .toContainText('Test Item');
});
```

## Required Elements

1. **@condition annotation**: `// @condition UC-RET`
2. **[UC-RET] prefix**: In test name
3. **Pre-existing data**: Login as user with data, don't create it
4. **Content assertions**: Verify actual content, not just visibility

## Test Data Setup

For UC-RET tests to work, you need test users with pre-existing data:

### Option 1: Database Fixtures

```typescript
// fixtures/test-users.ts
export const TEST_USERS = {
  returning: {
    email: 'returning@test.com',
    password: 'TestPassword123',
    // This user has existing items in the test database
  },
  new: {
    email: 'new@test.com',
    password: 'TestPassword123',
    // This user has no data
  }
};
```

### Option 2: Seed Script

```bash
# Run before E2E tests to ensure test users have data
npm run seed:test-data
```

### Option 3: Test Database State

Maintain a known database state with test users who have existing data.

## Checklist

Before submitting a UC-RET test:

- [ ] Test uses `// @condition UC-RET` annotation
- [ ] Test name includes `[UC-RET]` prefix
- [ ] Test does NOT create data during execution
- [ ] Test uses pre-existing user with known data
- [ ] Test asserts on actual content (not just visibility)
- [ ] Test would fail if existing data was missing
