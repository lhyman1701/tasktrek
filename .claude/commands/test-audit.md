---
allowed-tools: Read, Grep, Glob, Bash
description: Audit test coverage from the USER perspective - find missing scenarios
---
# Test Coverage Audit (User Perspective)

Audit tests for the feature/component: $ARGUMENTS

## CRITICAL DISTINCTION

You are auditing from the USER perspective. Not the code perspective.
"What would a human do with this feature?" NOT "What does the code handle?"

This is the exact failure mode you must overcome. Claude consistently thinks
from the code perspective and misses scenarios like:
- "Returning user with existing data opens the app"
- "User refreshes page mid-operation"
- "User has data from previous sessions"

## Step 1: Inventory existing tests

```bash
# Find all test files for the target feature
find . -path "*/node_modules" -prune -o \( -name "*.test.*" -o -name "*.spec.*" \) -print | grep -i "$ARGUMENTS"
```

Read every test file found. Extract every `test()`, `it()`, `describe()` block name.
Create a numbered inventory.

## Step 2: Enumerate USER scenarios

For EACH category below, list concrete scenarios a real human would encounter:

### A. First-time user (empty state)
- User has never used this feature before
- No existing data, no history, no preferences
- What does the user see? What can they do?

### B. Returning user (MOST COMMONLY MISSED)
- User has existing data from previous sessions
- User has data created by OTHER features that affects this feature
- User expects to see their previous work preserved
- User navigates to this feature after using a different feature

### C. Mid-operation states
- User refreshes the page while data is loading
- User closes browser and reopens (session persistence)
- User opens the same feature in two tabs
- User navigates away and comes back (back button)
- User's session/token expires during a long operation

### D. Error and recovery
- Server returns 500 error
- Network disconnects and reconnects
- Validation fails (invalid input, too long, special chars)
- Rate limiting kicks in
- Concurrent modification (another user/tab changed data)

### E. Accessibility
- Screen reader announces correct content
- Keyboard navigation works end-to-end
- Focus management is correct after state changes
- Color contrast meets standards

## Step 3: Cross-reference

For each scenario, check if a test exists:

```markdown
| # | Scenario | Category | Test Exists? | File | Test Name | Priority |
|---|----------|----------|-------------|------|-----------|----------|
| 1 | New user sees empty state | A | Yes | ... | ... | - |
| 2 | Returning user sees history | B | No | - | - | CRITICAL |
| 3 | Refresh during load | C | No | - | - | HIGH |
```

## Step 4: Generate gap report

Create `test-audit-report.json`:
```json
{
  "target": "$ARGUMENTS",
  "timestamp": "ISO-8601",
  "existing_tests": 15,
  "scenarios_identified": 30,
  "covered": 15,
  "missing": 15,
  "gaps": [
    {
      "id": 1,
      "scenario": "Returning user with existing data sees history on load",
      "category": "returning_user",
      "priority": "CRITICAL",
      "test_type": "e2e",
      "suggested_file": "e2e/feature/returning-user.spec.ts",
      "suggested_test_name": "test('returning user sees previous data on page load')"
    }
  ]
}
```

## Step 5: Prioritize

- **CRITICAL**: Returning user scenarios, data persistence, core UX flows
- **HIGH**: Error recovery, session management, concurrent operations
- **MEDIUM**: Edge cases (unicode, max length, rapid actions)
- **LOW**: Cosmetic, rare interaction patterns

## Rules

- USER perspective first. Always. "What would a human do?"
- Pay SPECIAL attention to returning user scenarios - these are systematically missed
- Every gap gets a concrete test name, file location, and implementation hints
