# /e2e-verify [feature]

Execute EXHAUST E2E verification protocol for the specified feature.

## Usage

```
/e2e-verify chat
/e2e-verify auth
/e2e-verify dashboard
```

## EXHAUST Protocol

### PHASE 1: INVENTORY (COUNT-FIRST)

**Before any testing, enumerate ALL of the following:**

```
1. Screens: Count total [N], then list ALL with URLs
2. Elements: Count total [M], then list ALL with selectors
3. Interactions: Count total [P], then list ALL with expected outcomes
4. Roles: Count total [R], then list ALL with credentials
```

**GATE:** All counts must be verified before proceeding. No testing until inventory is complete.

**Output Format:**
```
INVENTORY COMPLETE
- Screens: [N] total
  1. /feature - Main interface
  2. /feature/[id] - Detail view
  ...
- Elements: [M] total
  1. ELEM-001: Primary Button [data-testid="primary-btn"]
  2. ELEM-002: Search Input [data-testid="search-input"]
  ...
- Interactions: [P] total
  1. Click Primary -> Creates new item
  2. Click Item -> Loads details
  ...
- Roles: [R] total
  1. admin@example.com
  2. user@example.com
  ...
```

### PHASE 2: EXPECTED OUTCOMES

**For EACH interaction, define BEFORE testing:**

```
Interaction: [description]
Expected Outcome: [exact behavior that constitutes SUCCESS]
Failure Condition: [what constitutes FAILURE]
```

**Example:**
```
Interaction: Click existing item in list
Expected Outcome:
  - Item becomes selected (visual indicator)
  - Details for that item load in main area
  - Details contain actual content (not empty)
  - URL updates to /feature/[item-id]
Failure Condition:
  - Details don't load
  - Details are empty
  - Different item's details appear
  - Error message displayed
```

### PHASE 3: EXECUTION

**For EACH interaction x EACH role:**

```
1. Navigate to starting state
2. Screenshot BEFORE action
3. Execute action
4. Screenshot AFTER action
5. Compare ACTUAL to EXPECTED
6. Record verdict with REASON (not just "no error")
```

**Execution Log Format:**
```
[Role: user] [Interaction: Click item]
BEFORE: On /feature, no item selected
ACTION: Clicked item "Item 1"
AFTER: On /feature/item-123, details visible
EXPECTED: Details load with content
ACTUAL: 3 fields loaded, title contains "Item 1..."
VERDICT: PASS - Details loaded with actual content
```

### PHASE 4: SELF-AUDIT

**Before declaring verification complete, confirm:**

```
[ ] All [P] interactions tested
[ ] All [R] roles tested
[ ] "Click existing -> loads" tested (MANDATORY for any list/detail UI)
[ ] Every PASS has explicit reason (not "no error")
[ ] Would a user find missing tests? -> Must be NO
```

## Required Interactions (by Feature Type)

### List/Detail UI
MUST test ALL of these:
- [ ] Click existing item -> content LOADS
- [ ] Create new item
- [ ] Edit existing item
- [ ] Delete item
- [ ] Error handling (invalid input, network failure)
- [ ] Each role can access appropriately

### Auth
MUST test ALL of these:
- [ ] Login with valid credentials -> dashboard loads
- [ ] Login with invalid credentials -> error shown
- [ ] Logout -> redirected to login
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access enforced

## Output Format

```
E2E VERIFICATION: [Feature]
Date: YYYY-MM-DDTHH:MM:SSZ

INVENTORY
- Screens: [N] total
- Elements: [M] total
- Interactions: [P] total
- Roles: [R] total

RESULTS
Tests Executed: [X]
Passed: [Y]
Failed: [Z]

CRITICAL PATH
- Click existing -> loads: PASS/FAIL
- Create new: PASS/FAIL
- Submit action: PASS/FAIL
- Response received: PASS/FAIL

FAILURES (if any)
1. [Interaction] - [Reason]
2. ...

SELF-AUDIT
[x] All interactions tested
[x] All roles tested
[x] Click existing -> loads tested
[x] All PASS verdicts have reasons
[x] No missing tests a user would find

VERDICT: VERIFIED / NOT VERIFIED
Evidence: docs/verification/[feature]-[date].md
```
