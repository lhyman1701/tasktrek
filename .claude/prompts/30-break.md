# Break Things Prompt - Find Edge Cases

## Purpose

After implementing a feature, actively try to break it. Find edge cases the initial tests missed.

## Edge Case Categories

### 1. Input Validation

- Empty strings, null, undefined
- Very long strings (>10KB)
- Special characters: `<script>`, SQL injection attempts
- Unicode: emojis, RTL text, zero-width characters
- Negative numbers, zero, MAX_INT
- Invalid types (string where number expected)

### 2. Boundary Conditions

- First/last items in lists
- Empty arrays
- Single item arrays
- Maximum allowed items
- Off-by-one errors (index 0 vs 1)

### 3. State Transitions

- Rapid repeated actions (double-click, spam submit)
- Actions while loading
- Actions after timeout
- Concurrent modifications
- Stale data scenarios

### 4. Network Conditions

- Request timeout
- Connection dropped mid-request
- Slow response (>30s)
- Malformed response
- 4xx and 5xx errors

### 5. Authentication/Authorization

- Expired tokens
- Invalid tokens
- Missing permissions
- Cross-tenant access attempts
- Privilege escalation attempts

### 6. Data Integrity

- Orphaned records
- Circular references
- Duplicate entries
- Missing required fields
- Inconsistent state

## For Each Edge Case Found

1. Write a test that reproduces it
2. Verify the test fails
3. Implement the fix
4. Verify the test passes
5. Document in test file with comment

## Output Format

```
## Edge Cases Found

### [Category]: [Description]
- Reproduction: [Steps]
- Expected: [Behavior]
- Actual: [Behavior]
- Test: `test_[name]`
- Status: [ ] Fixed

### [Next edge case...]
```
