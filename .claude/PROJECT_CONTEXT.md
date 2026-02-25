# {{PROJECT_NAME}} - Complete Project Context

This file provides comprehensive context for Claude Code sessions. Read this to understand the full project scope.

---

## 1. Project Overview

**{{PROJECT_NAME}}** is {{PROJECT_DESCRIPTION}}.

**Tech Stack:** {{TECH_STACK}}

---

## 2. Tech Stack Reference

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | {{BACKEND_TECH}} | API layer |
| **Frontend** | {{FRONTEND_TECH}} | User interface |
| **Database** | {{DATABASE_TECH}} | Data storage |
| **Testing** | {{TEST_TECH}} | Quality assurance |

---

## 3. Directory Structure

```
{{PROJECT_NAME}}/
├── src/                    # Source code
├── tests/                  # Test files
├── docs/                   # Documentation
├── tasks/                  # Task specifications
├── progress/               # Wave progress files
└── .claude/                # Claude Code configuration
    ├── commands/           # Slash commands
    ├── hooks/              # Quality enforcement hooks
    ├── prompts/            # Guidance prompts
    ├── rules/              # Policy rules
    └── plans/              # Project-local plans
```

---

## 4. Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project rules for Claude Code |
| `SESSION_START.md` | Current session state |
| `.wave-config.json` | Wave definitions |
| `.claude/config.sh` | Test commands configuration |

---

## 5. Coding Standards

### General

- Write tests before implementation (TDD)
- Use meaningful variable names
- Keep functions focused and small
- Document complex logic

### Testing

- Minimum 80% coverage target
- Content assertions in E2E (not just visibility)
- Both UC-NEW and UC-RET conditions

---

## 6. Common Commands

```bash
# Testing
{{TEST_COMMAND}}
{{E2E_COMMAND}}

# Linting
{{LINT_COMMAND}}

# Type checking
{{TYPECHECK_COMMAND}}
```

---

## 7. Wave System

All work follows the wave system:

1. Create wave in `.wave-config.json`
2. Create tasks in `tasks/WAVE-XXX/`
3. Track progress in `progress/wave-XXX-status.md`
4. Use `/wave-status`, `/wave-next`, `/next-task`

---

## 8. Session Continuity

- Start: Read `SESSION_START.md` and `mcp__session-audit__start_session()`
- During: Log via `log_action()`, `log_decision()`, `log_task_change()`
- End: Update `SESSION_START.md` and `mcp__session-audit__end_session()`

---

**Last Updated**: {{DATE}}
