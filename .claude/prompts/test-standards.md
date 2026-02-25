# Test Standards

## Testing Rule (METICULOUS - NON-NEGOTIABLE)

| Principle              | Requirement                                               |
| ---------------------- | --------------------------------------------------------- |
| **NEVER assume**       | Nothing works unless tested with REAL E2E tests           |
| **End-to-end only**    | Backend/database checks are INSUFFICIENT - must verify UI |
| **Examine everything** | Tests must check ALL visible elements on screen           |
| **Compare values**     | Assert actual vs expected - no assumptions                |
| **Be meticulous**      | This is the ONLY acceptable standard                      |

**Database queries showing data do NOT mean the UI works.**
**Before claiming ANYTHING is fixed, run E2E tests that verify actual screen content.**

## Unit Test Requirements

### Naming Convention

```
test_[function]_[scenario]_[expected_outcome]
```

### Structure (AAA Pattern)

```python
def test_charge_with_valid_card_succeeds():
    # ARRANGE
    processor = PaymentProcessor()
    card = valid_test_card()

    # ACT
    result = processor.charge(card, amount=99.99)

    # ASSERT (minimum 3)
    assert result.status == "SUCCESS"
    assert result.amount == 99.99
    assert result.charge_id is not None
```

### Required Edge Cases

- NULL/empty inputs
- Boundary values (0, -1, MAX_INT)
- Type mismatches
- Error conditions
- Concurrent access (where applicable)

## E2E Test Requirements

### REQUIRED Assertions (Use These)

```typescript
await expect(locator).toHaveText("specific content");
await expect(locator).toContainText("partial content");
await expect(locator).toHaveValue("form value");
await expect(locator).toHaveAttribute("attr", "value");
await expect(page).toHaveURL(/expected-path/);
await expect(locator).toHaveCount(3);
```

### FORBIDDEN as Sole Assertions

```typescript
// These alone are NOT acceptable - WEAK assertions
await expect(locator).toBeVisible();
await expect(locator).toBeEnabled();
await expect(locator).toBeDefined();
expect(true).toBe(true); // TAUTOLOGY
```

### Correct Pattern

```typescript
test("user can complete checkout", async ({ page }) => {
  await page.goto("/checkout");

  // Fill form
  await page.fill('[data-testid="email"]', "test@example.com");

  // Submit
  await page.click('[data-testid="pay-button"]');

  // CONTENT assertions - verify actual behavior
  await expect(page.locator('[data-testid="confirmation"]')).toContainText(
    "Order confirmed",
  );
  await expect(page.locator('[data-testid="order-id"]')).toHaveText(
    /ORD-\d{6}/,
  );
  await expect(page).toHaveURL(/\/confirmation/);
});
```

## Coverage Thresholds

| Metric            | Minimum |
| ----------------- | ------- |
| Line coverage     | 80%     |
| Branch coverage   | 70%     |
| Function coverage | 80%     |

## Test Commands

Configure in `.claude/config.sh`:

```bash
TEST_COMMAND="npm test"
E2E_COMMAND="npm run test:e2e"
```
