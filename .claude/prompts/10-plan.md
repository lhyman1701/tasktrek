# Planning Prompt - Mandatory Before Implementation

**STOP.** Before writing ANY code, complete this planning phase.

## Required Output

### 1. Task Definition

```
Task: [Name]
Objective: [One sentence]
Success Criteria: [Measurable outcome]
```

### 2. Acceptance Criteria (Testable)

- [ ] AC1: [Specific, testable criterion]
- [ ] AC2: [Specific, testable criterion]
- [ ] AC3: [Specific, testable criterion]

### 3. Test Plan

#### Unit Tests to Write FIRST

| Test Name             | What It Verifies |
| --------------------- | ---------------- |
| `test_X_succeeds`     | [Behavior]       |
| `test_X_fails_when_Y` | [Error handling] |

#### E2E Tests (with content assertions)

| Scenario   | Content Assertions                    |
| ---------- | ------------------------------------- |
| Happy path | `toHaveText('...')`, `toHaveURL(...)` |
| Error case | `toContainText('error')`              |

### 4. Files to Modify

| File       | Change         | Corresponding Test |
| ---------- | -------------- | ------------------ |
| `src/x.ts` | [What changes] | `src/x.test.ts`    |

### 5. Observability Additions

- [ ] Log event: `[event_name]` with fields: [field1, field2]
- [ ] Trace span: `[span_name]` for [operation]

### 6. Risks

| Risk              | Mitigation      |
| ----------------- | --------------- |
| [Potential issue] | [How to handle] |

## Approval Gate

After presenting plan:
"Plan complete. Type 'approved' to proceed with TDD implementation."

**DO NOT write code until plan is approved.**
