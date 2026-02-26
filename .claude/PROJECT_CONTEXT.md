# TaskFlow - Complete Project Context

This file provides comprehensive context for Claude Code sessions. Read this to understand the full project scope.

---

## 1. Project Overview

**TaskFlow** is an AI-powered personal task manager with natural language capabilities, REST API, web app, and iOS app.

**Tech Stack:** TypeScript, Express, Prisma, PostgreSQL, React 19, Vite, TailwindCSS, TanStack Router/Query, React Native, Expo, AWS CDK

---

## 2. Tech Stack Reference

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Node.js 20 + Express + TypeScript + Prisma | API layer |
| **Frontend** | React 19 + Vite + TailwindCSS | User interface |
| **Database** | PostgreSQL 16 (AWS RDS) | Data storage |
| **Testing** | Jest + Playwright | Quality assurance |

---

## 3. Directory Structure

```
TaskFlow/
├── packages/
│   ├── api/                # Express backend API
│   ├── web/                # React web application
│   ├── mobile/             # React Native iOS app
│   └── shared/             # Shared types, schemas, utilities
├── infra/                  # AWS CDK infrastructure
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
npm test
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run typecheck
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

**Last Updated**: 2026-02-25
