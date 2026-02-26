# WAVE-003: Web App

## Overview

This wave builds the React web application with Vite, TailwindCSS, and TanStack Router/Query.

## Dependencies

- WAVE-002: AI Chat + Smart Lists (API must be deployed)

## Tasks

| Task | Title | Status | Dependencies |
|------|-------|--------|--------------|
| TASK-017 | Initialize Vite + React 19 Project | blocked | WAVE-002 |
| TASK-018 | Configure TailwindCSS + Design System | blocked | TASK-017 |
| TASK-019 | Set Up TanStack Router | blocked | TASK-017 |
| TASK-020 | Set Up TanStack Query + API Client | blocked | TASK-017 |
| TASK-021 | Build Three-Panel Layout | blocked | TASK-018, TASK-019 |
| TASK-022 | Build Sidebar with Projects/Labels | blocked | TASK-020, TASK-021 |
| TASK-023 | Build Task List Component | blocked | TASK-020, TASK-021 |
| TASK-024 | Build Quick Add Bar | blocked | TASK-020 |
| TASK-025 | Build Task Detail Panel | blocked | TASK-023 |
| TASK-026 | Build AI Chat Panel | blocked | TASK-020 |
| TASK-027 | Build Board View (Kanban) | blocked | TASK-023 |
| TASK-028 | Add Command Palette + Keyboard Shortcuts | blocked | TASK-021 |
| TASK-029 | Deploy to S3 + CloudFront | blocked | All tasks |

## Deliverables

- React 19 SPA with Vite
- TailwindCSS design system
- Three-panel responsive layout
- Task list with drag-and-drop
- Quick add with NLP parsing
- AI chat interface
- Kanban board view
- Command palette (Cmd+K)
- Dark mode support
- S3 + CloudFront deployment

## Success Criteria

1. All views render correctly
2. CRUD operations work via API
3. Quick add parses natural language
4. Chat interface works with tools
5. Dark mode toggles correctly
6. Keyboard shortcuts work
7. Deployed and accessible via HTTPS
