# Implementation Prompt - TDD Workflow

## TDD Cycle

For each feature or fix:

### 1. RED - Write Failing Test First

```bash
# Write test that verifies expected behavior
# Run test - must see FAILURE
$TEST_COMMAND -- --testNamePattern="test_name"
```

### 2. GREEN - Minimal Implementation

```bash
# Write minimum code to make test pass
# Run test - must see SUCCESS
$TEST_COMMAND -- --testNamePattern="test_name"
```

### 3. REFACTOR - Improve Code Quality

```bash
# Clean up without changing behavior
# Run all tests - must still pass
$TEST_COMMAND
```

## Implementation Checklist

For each file changed:

- [ ] Test written BEFORE implementation
- [ ] Test fails initially (RED)
- [ ] Implementation makes test pass (GREEN)
- [ ] Code refactored if needed
- [ ] All related tests still pass
- [ ] Linter passes: `$LINT_COMMAND`
- [ ] Type check passes: `$TYPECHECK_COMMAND`

## After Each Edit

Run post-edit verification:

```bash
$TEST_COMMAND --related
$LINT_COMMAND
$TYPECHECK_COMMAND
```

## Do NOT

- Skip writing tests first
- Write implementation before test
- Change tests to make them pass
- Add `@skip` or `.skip()` decorators
- Use `--no-verify` flags

## Evidence Required

After implementation, show:

1. Test output (actual, not summary)
2. Coverage percentage
3. Linter output (zero errors)
4. Type check output (zero errors)
