# Quality Rules (Detailed)

## The 5 Absolute Rules

1. **NEVER claim completion without evidence** - Show test output, not summaries
2. **NEVER ask human to verify what tools can verify** - Run tests yourself
3. **NEVER create visibility-only E2E tests** - Assert content, not just .toBeVisible()
4. **NEVER change code without updating tests** - Tests and code change together
5. **NEVER make diagnostic conclusions without evidence** - Logs first, then conclusions

## Evidence-Based Completion

### FORBIDDEN Patterns

- "It should work now" - without test output
- "Tests are exhaustive" - without coverage + mutation score
- "Can you check...?" - when tools can verify
- "The issue is probably X" - without checking logs first
- Changing tests to make them pass instead of fixing code
- Adding `@skip` or `.skip()` to hide failures
- Using `--no-verify` to bypass hooks

### REQUIRED Patterns

- Run tests, show actual output (not summary)
- Run linter, show zero errors
- Show coverage percentage for changed files
- For diagnostics: "Logs show X, trace shows Y, therefore Z"

## Definition of Done

A task is DONE **only** when ALL conditions are met AND evidence shown:

### Unit Tests

- [ ] Tests added for all changed behavior
- [ ] Minimum 3 assertions per test
- [ ] At least one negative test case per function
- [ ] Coverage >= 80% on changed files

### E2E Tests

- [ ] Happy path with CONTENT assertions (not just visibility)
- [ ] Error scenarios tested
- [ ] Playwright traces generated

### Code Quality

- [ ] Linter passes with zero errors
- [ ] Type check passes with zero errors
- [ ] No new warnings introduced

## Architectural Compliance Rules

### Deviation Protocol

If you believe a different approach is better:

1. **STOP** - Do not implement the alternative
2. **DOCUMENT** - Write out the tradeoffs clearly
3. **ASK** - Present options to user and wait for explicit approval
4. **NEVER** implement a deviation and document it after-the-fact

### Red Flags Requiring User Approval

- Changing storage technology
- Adding new database tables not in migration plan
- Modifying existing table schemas
- Changing API contract/response formats
- Introducing new dependencies
- Any "simpler" alternative to what's specified

## Multi-Tenant Schema Verification

| Before ANY tenant deployment | Verification Required                     |
| ---------------------------- | ----------------------------------------- |
| Schema columns               | Must match model                          |
| Enum values                  | Must match code enums                     |
| Migrations                   | Applied to tenant schema, not just public |
| Seed data                    | Must use CURRENT enum values              |

## Logging Compliance

**Sensitive data must NEVER appear in logs.** Only metadata is allowed.

| Allowed (Safe)                | Prohibited (Sensitive)       |
| ----------------------------- | ---------------------------- |
| `messageId`, `requestId`      | Message content, prompts     |
| `contentLength`, `tokenCount` | Personal identifiers         |
| `timestamp`, `correlationId`  | Passwords, tokens, secrets   |

Always use sanitizer functions for logging user data.
