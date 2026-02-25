# User Condition Testing - Implementation Prompts

## Overview

These prompts guide step-by-step implementation of the User Condition Testing Protocol.

---

## Prompt 0: Install Orchestration

Use this prompt to orchestrate the full installation:

```
## Task: Install User Condition Testing Protocol

Execute the following prompts in order:

1. Prompt 1: Create Coverage Registry
2. Prompt 2: Map Existing Tests
3. Prompt 3: Write Missing Tests
4. Prompt 4: Install CI Enforcement
5. Prompt 5: Verify Installation
6. Prompt 6: Document New Feature Workflow

After each prompt, verify completion before proceeding.
```

---

## Prompt 1: Create Coverage Registry

```
## Task: Create Coverage Registry

### Step 1: Create the registry file

Create `coverage-registry.yaml` with the following structure:

```yaml
# Coverage Registry - User Condition Testing Protocol
version: "1.0"
last_updated: "YYYY-MM-DD"

features:
  # Add features here after mapping existing tests

summary:
  total_features: 0
  fully_covered: 0
  partially_covered: 0
  conditions_tested: 0
  conditions_missing: 0
```

### Step 2: Identify all features that need coverage

List all features that involve user data:
- Authentication (login, logout, session)
- User management
- Core features
- Settings
- [Add others]

### Step 3: Output

Provide the initial registry file and the list of features to be mapped.
```

---

## Prompt 2: Map Existing Tests

```
## Task: Map Existing Tests to Conditions

### For each feature identified:

1. **Find existing test files**
   ```bash
   ls e2e/[feature]/ 2>/dev/null || ls tests/[feature]/ 2>/dev/null
   ```

2. **Analyze each test**
   - Read the test code
   - Determine which condition it covers:
     - UC-NEW: Creates data during test
     - UC-RET: Uses pre-existing data
     - UNKNOWN: Cannot determine

3. **Update registry**
   Add each feature to coverage-registry.yaml:

   ```yaml
   features:
     [feature-name]:
       conditions:
         UC-NEW:
           test_file: "[path]"
           test_name: "[name]"
           status: "passing" | "failing" | "missing"
         UC-RET:
           test_file: "[path]"
           test_name: "[name]"
           status: "passing" | "failing" | "missing"
       coverage_complete: true | false
   ```

4. **Add @condition annotations**
   Update test files to include annotations:
   ```typescript
   // @condition UC-NEW
   test('test name', async () => {});
   ```

### Output

- Updated coverage-registry.yaml
- List of tests annotated
- List of missing conditions
```

---

## Prompt 3: Write Missing Tests

```
## Task: Write Tests for Missing Conditions

### For each condition marked as "missing" in the registry:

1. **Identify the feature and missing condition**
   ```yaml
   feature: feature-name
   missing: UC-RET
   ```

2. **Complete SECA for the specific condition**

   **S - State:** What does a returning user have?
   **E - Enumerate:** What should the test verify?
   **C - Confirm:** Is this the only missing scenario?
   **A - Act:** Write the test

3. **Use the template**
   Follow `.claude/templates/returning-user-test-template.md`

4. **Verify the test**
   - Run the test
   - Confirm it passes
   - Confirm it would fail if feature broken

5. **Update registry**
   Change status from "missing" to "passing"

### Output

- New test files created
- Updated coverage-registry.yaml
- Test run results
```

---

## Prompt 4: Install CI Enforcement

```
## Task: Install CI Enforcement

### Step 1: Make verification script executable

```bash
chmod +x .claude/hooks/verify-condition-coverage.sh
```

### Step 2: Test the script locally

```bash
.claude/hooks/verify-condition-coverage.sh
```

Verify it:
- Counts tests by condition
- Checks the registry
- Reports coverage status

### Step 3: Add to CI workflow (optional)

If using CI, add verification step to your workflow.

### Output

- Script execution results
- CI configuration changes (if applicable)
```

---

## Prompt 5: Verify Installation

```
## Task: Verify Protocol Installation

### Checklist

1. **Documentation exists:**
   - [ ] .claude/prompts/IMPLEMENTATION-PROMPTS.md
   - [ ] .claude/prompts/user-condition-testing.md
   - [ ] .claude/templates/returning-user-test-template.md (create if needed)

2. **Scripts work:**
   ```bash
   .claude/hooks/verify-condition-coverage.sh
   # Should complete without error
   ```

3. **Registry exists and is valid:**
   ```bash
   cat coverage-registry.yaml
   # Should show features with conditions
   ```

4. **Tests are annotated:**
   ```bash
   grep -r "@condition" e2e/ tests/ 2>/dev/null | head -10
   # Should show annotated tests
   ```

5. **Coverage is acceptable:**
   - UC-NEW tests: > 0
   - UC-RET tests: > 0
   - No "missing" status in registry

### Output

Verification results for each item.
```

---

## Prompt 6: New Feature Workflow

Use this prompt when implementing NEW features:

```
## Task: Implement [FEATURE] with Condition Coverage

### Phase 1: SECA Enumeration

**S - State Inventory**

What user conditions exist for this feature?

| Condition | Description |
|-----------|-------------|
| UC-NEW | [New user scenario] |
| UC-RET | [Returning user scenario] |

**E - Enumerate**

| Condition | Test Case | Priority |
|-----------|-----------|----------|
| UC-NEW | [Test description] | High |
| UC-RET | [Test description] | High |

**C - Confirm**

- [ ] All conditions identified
- [ ] All test cases defined

**A - Act**

Proceed to Phase 2.

### Phase 2: Write Tests FIRST

For UC-NEW:
```typescript
// @condition UC-NEW
test('[UC-NEW] new user [action]', async ({ page }) => {
  // ...
});
```

For UC-RET:
```typescript
// @condition UC-RET
test('[UC-RET] returning user [action]', async ({ page }) => {
  // Uses pre-existing data, does NOT create data
  // ...
});
```

Run tests - they should FAIL (feature not implemented yet).

### Phase 3: Implement Feature

Write the feature code.

### Phase 4: Verify Tests Pass

Run tests - they should now PASS.

### Phase 5: Update Registry

Add to coverage-registry.yaml:
```yaml
[feature-name]:
  conditions:
    UC-NEW:
      test_file: "[path]"
      test_name: "[name]"
      status: "passing"
    UC-RET:
      test_file: "[path]"
      test_name: "[name]"
      status: "passing"
  coverage_complete: true
```

### Phase 6: Final Verification

```bash
.claude/hooks/verify-condition-coverage.sh
```

### Output

- SECA analysis document
- Test files created
- Feature code
- Registry update
- Verification results
```

---

## Quick Reference

| Prompt | Purpose | When to Use |
|--------|---------|-------------|
| 0 | Full installation | Initial setup |
| 1 | Create registry | Start of protocol adoption |
| 2 | Map existing tests | After creating registry |
| 3 | Write missing tests | Fill coverage gaps |
| 4 | Install CI | After tests are mapped |
| 5 | Verify installation | After all steps complete |
| 6 | New feature | Every new feature |
