# WAVE-004: iOS App

## Overview

This wave builds the React Native iOS app using Expo with shared query hooks.

## Dependencies

- WAVE-002: AI Chat + Smart Lists (API must be deployed)

## Tasks

| Task | Title | Status | Dependencies |
|------|-------|--------|--------------|
| TASK-030 | Initialize Expo Project | blocked | WAVE-002 |
| TASK-031 | Set Up Tab Navigation | blocked | TASK-030 |
| TASK-032 | Share Query Hooks from packages/shared | blocked | TASK-030 |
| TASK-033 | Build Inbox Tab (Task List) | blocked | TASK-031, TASK-032 |
| TASK-034 | Build Quick Add Screen | blocked | TASK-032 |
| TASK-035 | Build Task Detail Screen | blocked | TASK-033 |
| TASK-036 | Add Swipe Actions (Complete/Delete) | blocked | TASK-033 |
| TASK-037 | Build AI Chat Tab | blocked | TASK-032 |
| TASK-038 | Implement Push Notifications | blocked | TASK-030 |

## Deliverables

- Expo managed workflow app
- Tab navigation (Inbox, Today, Chat, Settings)
- Task list with swipe actions
- Quick add with NLP
- AI chat interface
- Push notifications for reminders
- TestFlight ready build

## Success Criteria

1. App runs on iOS simulator
2. All tabs navigate correctly
3. Tasks sync with API
4. Quick add works with NLP
5. Push notifications received
6. TestFlight build uploads
