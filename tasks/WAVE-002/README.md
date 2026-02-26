# WAVE-002: AI Chat + Smart Lists

## Overview

This wave adds AI-powered features including natural language parsing, chat with Claude tools, and smart list queries.

## Dependencies

- WAVE-001: Backend API + Database (must be complete)

## Tasks

| Task | Title | Status | Dependencies |
|------|-------|--------|--------------|
| TASK-010 | Implement NLP Service (Claude API parsing) | blocked | WAVE-001 |
| TASK-011 | Build AI Parse Endpoint | blocked | TASK-010 |
| TASK-012 | Build Quick-Add Endpoint | blocked | TASK-010 |
| TASK-013 | Implement Chat Service with Claude Tools | blocked | TASK-010 |
| TASK-014 | Add Conversation Persistence | blocked | TASK-013 |
| TASK-015 | Implement Smart List Queries | blocked | WAVE-001 |
| TASK-016 | Deploy API to AWS (CDK) | blocked | All tasks |

## Deliverables

- NLP service that parses natural language into structured tasks
- Quick-add endpoint for fast task creation
- Chat service with Claude tool use for task management
- Conversation history persistence
- Smart list queries (today, upcoming, overdue, etc.)
- AWS CDK deployment stack

## Success Criteria

1. "Buy milk tomorrow at 3pm" parses correctly
2. Chat can create, update, complete tasks via tools
3. Smart lists return correct filtered results
4. API deployed and accessible via HTTPS
