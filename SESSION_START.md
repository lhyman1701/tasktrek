# Session Start - TaskFlow

**Updated:** 2026-02-26

---

## Current Status

- **Active Wave:** WAVE-003 (Web App) - Deployed and functional
- **Sprint Goal:** Bug fixes and polish
- **Blockers:** None

---

## Quick Context

AI-powered personal task manager with natural language capabilities. Backend API (Express/Prisma/PostgreSQL) and Web App (React/Vite/TailwindCSS) are deployed and working.

**Live URLs:**
- Web App: https://d34lvftbnikqz7.cloudfront.net
- API: https://d34lvftbnikqz7.cloudfront.net/api

---

## Recent Sessions

| Session | Date | Summary |
|---------|------|---------|
| 12 | 2026-02-26 | Fixed project colors, timezone date display, smart list filtering |
| 11 | 2026-02-26 | Fixed priority updates, AI chat markdown rendering |
| 10 | 2026-02-26 | Fixed project modal, task counts in sidebar |

---

## Fixes This Session

1. **Project Color Display** - Created `/packages/web/src/lib/colors.ts` with `getColorHex()` to map color names to hex values
2. **Project Modal Race Condition** - Added `initializedRef` to prevent TanStack Query refetches from overwriting user selection
3. **Timezone Date Display** - Fixed `formatRelativeDate()` and `isDateOverdue()` to use UTC methods
4. **Smart List Filtering** - Changed date storage to noon UTC (T12:00:00.000Z) to prevent timezone shifts

---

## Test Status

- **Last Run:** Not run (no test suite configured yet)
- **E2E:** Not configured

---

## Next Session Should

1. Read this file for context
2. Test the timezone fixes work correctly
3. Consider adding test suite for API endpoints
4. Continue with remaining WAVE-003 tasks or start WAVE-004 (iOS App)

---

## Deployment Info

- **AWS Profile:** todobloom
- **Web S3 Bucket:** taskflow-web-dev-635165708055
- **CloudFront Distribution:** E3TFSUO02HOYYK
- **ECR Repository:** 635165708055.dkr.ecr.us-east-1.amazonaws.com/taskflow-api-dev
- **ECS Cluster:** taskflow-dev
- **ECS Service:** taskflow-api-dev

---

## Key Files Modified This Session

- `/packages/web/src/lib/colors.ts` (NEW) - Color name to hex mapping
- `/packages/web/src/lib/utils.ts` - Added `dateToNoonUTC()`, `dateToInputValue()`, `isDateOverdue()`, fixed `formatRelativeDate()`
- `/packages/web/src/components/projects/ProjectModal.tsx` - Fixed color selection race condition
- `/packages/web/src/components/layout/Sidebar.tsx` - Use `getColorHex()` for project colors
- `/packages/web/src/components/tasks/TaskItem.tsx` - Use `getColorHex()` and `isDateOverdue()`
- `/packages/web/src/components/tasks/TaskDetailPanel.tsx` - Use `getColorHex()`, `dateToNoonUTC()`, `dateToInputValue()`
- `/packages/api/src/services/nlpService.ts` - Changed `combineDateAndTime()` to use noon UTC

---

**Session ended:** 2026-02-26T03:14:00Z
