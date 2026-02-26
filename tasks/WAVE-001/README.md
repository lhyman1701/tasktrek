# WAVE-001: Backend API + Database

## Overview

This wave establishes the core backend infrastructure for TaskFlow, including the monorepo structure, database schema, Express API, and authentication.

## Dependencies

None - this is the foundation wave.

## Tasks

| Task | Title | Status | Dependencies |
|------|-------|--------|--------------|
| TASK-001 | Initialize Monorepo with npm Workspaces | ready | None |
| TASK-002 | Create Shared Package with Zod Schemas | blocked | TASK-001 |
| TASK-003 | Define Prisma Schema and Run Migration | blocked | TASK-001, TASK-002 |
| TASK-004 | Build Express App Foundation | blocked | TASK-001 |
| TASK-005 | Add Auth Middleware (Bearer Token) | blocked | TASK-004 |
| TASK-006 | Add Zod Validation Middleware | blocked | TASK-002, TASK-004 |
| TASK-007 | Build CRUD Routes (Tasks, Projects, Labels, Sections) | blocked | TASK-003, TASK-005, TASK-006 |
| TASK-008 | Set Up Docker Compose for Local Dev | blocked | TASK-004 |
| TASK-009 | Write Unit Tests for All Endpoints | blocked | TASK-007 |

## Deliverables

- Monorepo with npm workspaces (`packages/api`, `packages/shared`)
- Prisma schema with Task, Project, Label, Section models
- Express API with CRUD endpoints
- Bearer token authentication
- Zod validation middleware
- Docker Compose for local PostgreSQL
- Unit tests with 80%+ coverage

## Success Criteria

1. `npm install` works from root
2. `npm test` passes all tests
3. Docker Compose starts PostgreSQL
4. API endpoints respond correctly via curl
5. Auth middleware rejects invalid tokens
