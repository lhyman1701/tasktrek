# TaskFlow

## Tech Stack

TypeScript, Express, Prisma, PostgreSQL, React 19, Vite, TailwindCSS, TanStack Router/Query, React Native, Expo, AWS CDK

---

## Session Protocol

**Start:** `mcp__session-audit__start_session(project_path="/Users/louis/CodeProjects/Utilities/tasktrek")`
**During:** Log actions/decisions in real-time (every 2-3 tool calls)
**End:** `mcp__session-audit__end_session(summary="...")`

**Full protocol:** `.claude/prompts/00-system.md`

---

## The Core Rule: Evidence-Based Completion

**CODE CHANGE != FIX.** Only "verified fix" counts as "fixed".

FORBIDDEN phrases without evidence:
- "Done", "Complete", "Fixed", "Working", "Implemented"

REQUIRED evidence for ANY completion claim:
1. Tests pass (with full output shown)
2. Manual verification with screenshots
3. E2E test output (full, not summary)
4. User journey completed as a real user would experience

**Full checklist:** `.claude/prompts/40-verify.md`

---

## Testing

- **Run:** `npm test`
- **E2E:** `npm run test:e2e`
- **Default assumption:** App is broken, not the test

**Full testing rules:** `.claude/rules/testing.md`

---

## Wave System

All work requires: Wave ID + Task IDs + progress file

```
1. Convert plan to Wave in .wave-config.json
2. Create tasks (TASK-XXX) with specs in tasks/[WAVE-ID]/
3. Create progress/wave-XXX-status.md
4. Execute via wave system, not standalone
```

**Commands:** `/create-wave`, `/wave-status`, `/wave-next`
**Full protocol:** `.claude/prompts/10-plan.md`

---

## Commands

| Action | Command |
|--------|---------|
| Test | `npm test` |
| E2E | `npm run test:e2e` |
| Lint | `npm run lint` |
| Type Check | `npm run typecheck` |

---

## Key Files

| File | Purpose |
|------|---------|
| `SESSION_START.md` | Current session state |
| `.claude/PROJECT_CONTEXT.md` | Full architecture |
| `.claude/rules/testing.md` | Testing protocol |
| `.claude/rules/accountability.md` | Ownership rules |
| `.claude/rules/diagnostics.md` | Debug checklist |
| `.wave-config.json` | Wave definitions |

---

## Critical Paths

**Test failures:** See `.claude/rules/testing.md` decision tree
**Diagnostics:** Exhaust `.claude/rules/diagnostics.md` before asking human

---

## Behavioral Rules

1. **Read code before asking** - grep/glob/read first
2. **Own problems you find** - no "pre-existing" deflection
3. **Plans stay local** - use `.claude/plans/` not `~/.claude/plans/`
4. **Evidence over assertion** - prove claims with test output

**Full rules:**
- `.claude/rules/accountability.md`
- `.claude/rules/plans-isolation.md`

---

## Session Continuity

**End of session:** Search modified files for "Next Steps", "TODO". For each: complete it, create wave/task, or `mark_incomplete()`.

**Start of session:** Check `.claude/plans/` and `progress/*.md` for unactioned items.

**Pre-flight checklist:** `.claude/SESSION_PREFLIGHT_CHECKLIST.md`

---

## Anti-Sycophancy

- Challenge assumptions when they seem wrong
- Say "I don't know" when uncertain
- Prove claims with test output, not assertions
