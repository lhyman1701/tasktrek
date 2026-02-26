# AI-Powered Personal Task Manager: Architecture & Recommendations

## Executive Summary

This document provides a comprehensive blueprint for building an **AI-powered personal task management application** with natural language capabilities, a REST API for integrations, AWS hosting, a **web app** (primary client), and an **iOS app** (secondary client).

**Developer Profile:** Advanced developer, solo/personal use, budget unconstrained.

**Key implications of this profile:**

- **No multi-tenancy or collaboration** — simplifies auth, data model, and API design dramatically
- **Auth can be minimal** — a static bearer token or self-issued JWT; no Cognito user pools needed
- **Single-user PostgreSQL** — no row-level security, no tenant isolation, simpler queries
- **Budget freedom** — use an always-on ECS Fargate container instead of Lambda (avoids cold starts, simpler debugging, real Express server)
- **API-first for personal automation** — the REST API becomes your primary integration surface for iOS Shortcuts, n8n, Raycast, CLI scripts, MCP servers, etc.
- **AI goes deep** — since you're the only user, the AI layer can be highly personalized: it learns your projects, your patterns, your shorthand
- **Web first, then iOS** — the web app ships first because iteration is fastest, Claude Code is at peak performance with React web apps, and there's no App Store review cycle. The iOS app follows, sharing types and API client code via the monorepo

The technology choices are deliberately conservative — favoring the tools Claude Code knows best — to minimize errors and maximize development velocity.

---

## 1. Feature Set: Detailed Specifications

### 1.1 Natural Language Task Input (The Core Differentiator)

This is the feature that separates your app from a simple CRUD todo list. The system accepts freeform text and extracts structured task data using Claude's API.

#### 1.1.1 Input Parsing Rules

The parser should understand these patterns (modeled after Todoist's Quick Add syntax, which is the industry gold standard):

| Input Pattern | Extracted Field | Example |
|---|---|---|
| Bare text | `title` | "Buy milk" → title: "Buy milk" |
| `tomorrow`, `next friday`, `jan 15` | `due_date` | "Call mom tomorrow" → due: 2026-02-26 |
| `at 3pm`, `at 14:00` | `due_time` | "Meeting at 3pm" → time: 15:00 |
| `#ProjectName` | `project` | "Fix bug #Work" → project: "Work" |
| `@label` | `labels[]` | "Buy milk @errands @quick" → labels: ["errands", "quick"] |
| `p1` through `p4` | `priority` | "Server down p1" → priority: 1 |
| `every monday`, `daily`, `weekly` | `recurrence` | "Standup every weekday at 9am" → recurrence pattern |
| `//note text` | `description` | "Call dentist //ask about insurance" → description: "ask about insurance" |
| `!30m`, `!2h` | `duration` | "Deep work !2h" → duration: 120 min |

#### 1.1.2 How Parsing Works (Technical Flow)

```
┌──────────────────────────────────────────────────────────┐
│  User Input: "Call dentist next Tuesday 2pm #Health p1   │
│               @phone //ask about coverage renewal"       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Step 1: Quick Pre-Parse (regex, no AI needed)           │
│  • Extract #Health → project_hint: "Health"              │
│  • Extract @phone → label_hints: ["phone"]               │
│  • Extract p1 → priority_hint: 1                         │
│  • Extract //... → description_hint: "ask about..."      │
│  • Remaining: "Call dentist next Tuesday 2pm"             │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Step 2: Claude API Call (for date/time/title parsing)   │
│                                                          │
│  System prompt includes:                                 │
│  • Current date/time and timezone                        │
│  • List of existing projects (for fuzzy matching)        │
│  • List of existing labels                               │
│  • Tool definition with Zod-like schema                  │
│                                                          │
│  Claude returns structured JSON via tool_use:            │
│  {                                                       │
│    "title": "Call dentist",                              │
│    "due_date": "2026-03-03",                             │
│    "due_time": "14:00",                                  │
│    "priority": 1,                                        │
│    "project": "Health",                                  │
│    "labels": ["phone"],                                  │
│    "description": "ask about coverage renewal"           │
│  }                                                       │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  Step 3: Validation & Resolution                         │
│  • Validate with Zod schema                              │
│  • Resolve "Health" → project UUID (fuzzy match)         │
│  • Create missing labels if needed                       │
│  • Compute next occurrence for recurring tasks           │
│  • Persist to PostgreSQL via Prisma                      │
└──────────────────────────────────────────────────────────┘
```

#### 1.1.3 Why Hybrid Parsing (Regex + AI)?

Using Claude for *everything* would be slow (~500ms per call) and expensive at scale. The hybrid approach:

- **Regex first** for deterministic patterns (`#`, `@`, `p1-4`, `//`) — instant, free, no API call
- **Claude only** for the hard parts: natural language dates ("next Tuesday", "in 3 days", "end of month"), ambiguous titles, and context-dependent parsing
- **Fallback**: If Claude is unreachable, still create the task with the regex-parsed fields and raw text as the title

#### 1.1.4 Claude API Prompt Design

```typescript
const systemPrompt = `You are a task parsing engine. Given natural language input,
extract structured task data. Today is ${today} (${timezone}).

The user's existing projects are: ${projectNames.join(', ')}
The user's existing labels are: ${labelNames.join(', ')}

Rules:
- If a project name is close but not exact, match to the closest existing project
- If no project is specified, leave project as null (goes to Inbox)
- For relative dates: "tomorrow" = ${tomorrow}, "next week" = ${nextMonday}
- For recurring: return an RRULE-compatible string
- If you can't determine a field, omit it (don't guess)
- Title should be clean and actionable (remove date/project/label tokens)`;

// Use tool_use for structured output
const tools = [{
  name: "create_task",
  description: "Parse natural language into a structured task",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Clean task title" },
      due_date: { type: "string", description: "ISO date YYYY-MM-DD" },
      due_time: { type: "string", description: "HH:MM in 24hr format" },
      priority: { type: "integer", enum: [1, 2, 3, 4] },
      project: { type: "string", description: "Project name or null" },
      labels: { type: "array", items: { type: "string" } },
      description: { type: "string" },
      recurrence: { type: "string", description: "RRULE string or null" },
      duration_minutes: { type: "integer" }
    },
    required: ["title"]
  }
}];
```

---

### 1.2 AI Conversational Interface (Chat Mode)

Beyond parsing single tasks, the app exposes a chat endpoint where you can manage tasks conversationally. This is the "killer feature" for a personal tool.

#### 1.2.1 Supported Conversation Patterns

| Category | Example Prompts | What Happens |
|---|---|---|
| **Query** | "What's on my plate today?" | Returns today's tasks, sorted by priority, in natural language |
| **Query** | "Show me overdue tasks" | Queries tasks where due_date < today AND is_completed = false |
| **Query** | "How many tasks did I complete this week?" | Aggregation query, returns count + summary |
| **Query** | "What's in my Work project?" | Lists all active tasks in the Work project |
| **Create** | "Add buy groceries to my shopping list for Saturday" | Parses and creates task |
| **Create** | "I need to schedule 3 meetings: with Alice Monday, Bob Tuesday, Carol Wednesday" | Batch creates 3 tasks |
| **Update** | "Move the dentist appointment to next Friday" | Finds task by fuzzy title match, updates due_date |
| **Update** | "Make all my @errands tasks high priority" | Bulk update by label |
| **Update** | "Push everything from today to tomorrow except P1s" | Conditional bulk reschedule |
| **Complete** | "I finished the grocery shopping" | Fuzzy matches task, marks complete |
| **Complete** | "Mark all tasks in the Shopping project as done" | Bulk complete |
| **Delete** | "Remove the duplicate dentist task" | Fuzzy match + delete (with confirmation) |
| **Summarize** | "Give me a weekly review" | Completed count, overdue count, upcoming deadlines |
| **Suggest** | "Help me plan my morning" | Looks at today's tasks + priorities, suggests an order |
| **Triage** | "I have 20 minutes free, what should I do?" | Filters by estimated duration + priority |

#### 1.2.2 Technical Architecture for Chat

```typescript
// POST /ai/chat
// Body: { message: string, conversation_id?: string }

// The chat endpoint works by:
// 1. Loading conversation history (last N messages) for context
// 2. Loading current task state (today's tasks, overdue count, etc.)
// 3. Sending everything to Claude with tools for CRUD operations
// 4. Claude decides which tool(s) to call
// 5. Execute the tool calls against your database
// 6. Return Claude's natural language response + any mutations made

const chatTools = [
  { name: "list_tasks", description: "Query tasks with filters", input_schema: {
    properties: {
      project: { type: "string" },
      label: { type: "string" },
      due_before: { type: "string" },
      due_after: { type: "string" },
      is_completed: { type: "boolean" },
      priority: { type: "integer" },
      search: { type: "string" },
      limit: { type: "integer" }
    }
  }},
  { name: "create_task", /* ... same as NLP parser ... */ },
  { name: "update_task", input_schema: {
    properties: {
      task_id: { type: "string" },
      title: { type: "string" },
      due_date: { type: "string" },
      priority: { type: "integer" },
      project: { type: "string" },
      // ... all mutable fields
    },
    required: ["task_id"]
  }},
  { name: "complete_task", input_schema: {
    properties: { task_id: { type: "string" } },
    required: ["task_id"]
  }},
  { name: "delete_task", input_schema: {
    properties: { task_id: { type: "string" } },
    required: ["task_id"]
  }},
  { name: "search_tasks", input_schema: {
    properties: { query: { type: "string" } },
    required: ["query"]
  }},
  { name: "get_summary", input_schema: {
    properties: { period: { type: "string", enum: ["today", "week", "month"] } }
  }}
];
```

#### 1.2.3 Conversation Memory

Since this is a personal tool, the chat can maintain context:

- Store conversation messages in a `chat_messages` table
- Include last 10 messages as context in each Claude call
- Support `conversation_id` to continue threads
- Auto-expire old conversations after 24 hours

---

### 1.3 Core Task Management (CRUD)

#### 1.3.1 Task Lifecycle

```
                    ┌─────────┐
         ┌─────────│  INBOX  │ (no project assigned)
         │         └────┬────┘
         │              │ assign to project
         │              ▼
         │         ┌─────────┐
    create task ──►│  ACTIVE │◄──── uncomplete
         │         └────┬────┘
         │              │
         │         ┌────┴────┐
         │         │         │
         │         ▼         ▼
         │    ┌─────────┐  ┌─────────┐
         │    │COMPLETED│  │ DELETED │
         │    └────┬────┘  └─────────┘
         │         │
         │         │ (if recurring)
         │         ▼
         │    ┌──────────────────┐
         └────│ NEW OCCURRENCE   │ (clone with next due date)
              └──────────────────┘
```

#### 1.3.2 Projects

Projects are the primary organizational unit. Every task belongs to exactly one project (defaulting to "Inbox").

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | "Work", "Personal", "Shopping" |
| `color` | string | Hex color for UI, e.g., "#FF6B6B" |
| `icon` | string | Optional emoji or icon name, e.g., "💼" |
| `is_inbox` | boolean | Exactly one project is the inbox (cannot be deleted) |
| `is_archived` | boolean | Hidden but preserved |
| `sort_order` | integer | Manual ordering |
| `default_priority` | integer | New tasks inherit this priority |
| `view_style` | enum | "list" or "board" |
| `description` | string | Optional project notes |

**Special project: Inbox** — Auto-created, cannot be deleted. Tasks without a project assignment land here. This mirrors both Todoist and TickTick behavior.

#### 1.3.3 Tasks (Detailed Field Spec)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | auto | Primary key |
| `title` | string | ✅ | The task text, max 500 chars |
| `description` | text | | Rich text/markdown notes |
| `project_id` | UUID | ✅ | FK to Project (defaults to Inbox) |
| `parent_id` | UUID | | FK to Task (for subtasks, max depth 1 for MVP) |
| `section_id` | UUID | | FK to Section within a project |
| `priority` | 1-4 | ✅ | 1=urgent/red, 2=high/orange, 3=medium/blue, 4=none/gray |
| `due_date` | date | | YYYY-MM-DD |
| `due_time` | time | | HH:MM (null = all-day task) |
| `due_datetime` | timestamp | | Computed: due_date + due_time (for sorting/querying) |
| `duration_minutes` | integer | | Estimated time to complete |
| `is_recurring` | boolean | | |
| `recurrence_rule` | string | | RRULE format: "FREQ=WEEKLY;BYDAY=MO,WE,FR" |
| `is_completed` | boolean | ✅ | Default false |
| `completed_at` | timestamp | | When it was completed |
| `sort_order` | integer | | Manual ordering within project/section |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

#### 1.3.4 Labels / Tags

Labels are cross-cutting — a task can have many labels, and a label can be on many tasks. They're ideal for contexts (where you are: @home, @office, @errands) and energy levels (@deep-work, @quick-win, @low-energy).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `name` | string | Unique, lowercase, e.g., "errands" |
| `color` | string | Hex color |

**Join table `task_labels`:** `(task_id, label_id)` composite primary key.

#### 1.3.5 Sections

Sections subdivide a project. Think of Kanban columns: "To Do", "In Progress", "Done". Or stages: "Research", "Draft", "Review", "Published".

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `project_id` | UUID | FK to Project |
| `name` | string | e.g., "In Progress" |
| `sort_order` | integer | |

#### 1.3.6 Recurring Tasks

Recurrence is one of the most complex features. Use the **RRULE standard** (RFC 5545) for maximum flexibility:

| Natural Language | RRULE |
|---|---|
| "every day" | `FREQ=DAILY` |
| "every weekday" | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| "every Monday" | `FREQ=WEEKLY;BYDAY=MO` |
| "every 2 weeks" | `FREQ=WEEKLY;INTERVAL=2` |
| "every month on the 15th" | `FREQ=MONTHLY;BYMONTHDAY=15` |
| "every month on the last friday" | `FREQ=MONTHLY;BYDAY=-1FR` |
| "every year on March 1" | `FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=1` |

**Completion behavior:** When a recurring task is completed, the system:
1. Marks the current instance as completed
2. Computes the next occurrence date from the RRULE
3. Creates a new task with the next due date (clone of original)
4. Preserves a link: `recurrence_parent_id` points to the original task

Use the `rrule` npm package (TypeScript-compatible) for computation — Claude Code knows this library well.

#### 1.3.7 Smart Lists / Filters

These are virtual views, not physical lists. They're computed queries:

| Smart List | Query Logic |
|---|---|
| **Today** | `due_date = today OR (is_overdue AND NOT completed)` |
| **Tomorrow** | `due_date = tomorrow` |
| **Next 7 Days** | `due_date BETWEEN today AND today+7` |
| **Inbox** | `project_id = inbox_project_id AND NOT completed` |
| **Overdue** | `due_date < today AND NOT completed` |
| **No Date** | `due_date IS NULL AND NOT completed` |
| **High Priority** | `priority IN (1, 2) AND NOT completed` |
| **Recently Completed** | `completed_at > now() - interval '7 days'` |

**Custom filters** (Phase 2): Let the user define saved filters with a simple query syntax:
```
priority:1 AND label:errands AND due:next7days
project:Work AND NOT label:delegated
```

---

### 1.4 REST API Design (Detailed Endpoints)

#### 1.4.1 API Conventions

| Convention | Value |
|---|---|
| Base URL | `https://api.yourdomain.com/v1` |
| Auth | `Authorization: Bearer <your-api-key>` |
| Content-Type | `application/json` |
| IDs | UUID v4 strings |
| Dates | ISO 8601 (`2026-02-25`, `2026-02-25T14:00:00Z`) |
| Pagination | Cursor-based: `?cursor=<id>&limit=50` |
| Errors | `{ "error": { "code": "NOT_FOUND", "message": "Task not found" } }` |
| Success | `{ "data": <T> }` or `{ "data": <T[]>, "cursor": "<next>" }` |

#### 1.4.2 Tasks

```
GET    /v1/tasks                    List tasks (with filters)
GET    /v1/tasks/:id                Get single task
POST   /v1/tasks                    Create task
PATCH  /v1/tasks/:id                Update task
DELETE /v1/tasks/:id                Delete task
POST   /v1/tasks/:id/complete       Mark complete
POST   /v1/tasks/:id/uncomplete     Mark incomplete
POST   /v1/tasks/:id/move           Move to different project/section

Query parameters for GET /v1/tasks:
  ?project_id=<uuid>               Filter by project
  ?label=<name>                    Filter by label name
  ?priority=<1|2|3|4>             Filter by priority
  ?due_before=<date>               Tasks due before date
  ?due_after=<date>                Tasks due after date
  ?is_completed=<bool>             Filter by completion status
  ?search=<string>                 Full-text search
  ?smart_list=<today|tomorrow|week|overdue|inbox|no_date>
  ?sort_by=<due_date|priority|created_at|sort_order>
  ?sort_dir=<asc|desc>
  ?cursor=<string>                 Pagination cursor
  ?limit=<int>                     Page size (default 50, max 200)
```

**Create task request body:**
```json
{
  "title": "Call dentist",
  "description": "Ask about coverage renewal",
  "project_id": "uuid-of-health-project",
  "priority": 1,
  "due_date": "2026-03-03",
  "due_time": "14:00",
  "labels": ["phone", "health"],
  "duration_minutes": 15,
  "recurrence_rule": null,
  "parent_id": null,
  "section_id": null
}
```

**Create task response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Call dentist",
    "description": "Ask about coverage renewal",
    "project_id": "uuid-of-health-project",
    "project_name": "Health",
    "parent_id": null,
    "section_id": null,
    "priority": 1,
    "due_date": "2026-03-03",
    "due_time": "14:00",
    "due_datetime": "2026-03-03T14:00:00Z",
    "duration_minutes": 15,
    "labels": [
      { "id": "label-uuid-1", "name": "phone", "color": "#4A90D9" },
      { "id": "label-uuid-2", "name": "health", "color": "#FF6B6B" }
    ],
    "is_recurring": false,
    "recurrence_rule": null,
    "is_completed": false,
    "completed_at": null,
    "sort_order": 1,
    "created_at": "2026-02-25T10:30:00Z",
    "updated_at": "2026-02-25T10:30:00Z"
  }
}
```

#### 1.4.3 Projects

```
GET    /v1/projects                 List all projects
GET    /v1/projects/:id             Get single project (with task count)
POST   /v1/projects                 Create project
PATCH  /v1/projects/:id             Update project
DELETE /v1/projects/:id             Delete project (moves tasks to Inbox)
POST   /v1/projects/:id/archive     Archive project
POST   /v1/projects/:id/unarchive   Unarchive project
```

#### 1.4.4 Sections

```
GET    /v1/projects/:id/sections    List sections in a project
POST   /v1/sections                 Create section
PATCH  /v1/sections/:id             Update section
DELETE /v1/sections/:id             Delete section (moves tasks to unsectioned)
```

#### 1.4.5 Labels

```
GET    /v1/labels                   List all labels (with task counts)
POST   /v1/labels                   Create label
PATCH  /v1/labels/:id               Update label
DELETE /v1/labels/:id               Delete label (removes from all tasks)
```

#### 1.4.6 AI Endpoints

```
POST   /v1/ai/parse                 Parse natural language → structured task
  Body: { "text": "Buy milk tomorrow #Shopping p2" }
  Returns: { "data": { "title": "Buy milk", "due_date": "...", ... } }

POST   /v1/ai/quick-add             Parse AND create in one step
  Body: { "text": "Buy milk tomorrow #Shopping p2" }
  Returns: { "data": { /* created task object */ } }

POST   /v1/ai/chat                  Conversational task management
  Body: { "message": "What's on my plate today?", "conversation_id": "optional" }
  Returns: {
    "data": {
      "response": "You have 5 tasks today. Your top priority is...",
      "mutations": [ /* any tasks created/updated/completed */ ],
      "conversation_id": "conv-uuid"
    }
  }

GET    /v1/ai/summary               Get productivity summary
  ?period=today|week|month
  Returns: {
    "data": {
      "completed": 12,
      "created": 8,
      "overdue": 3,
      "upcoming_deadlines": [...],
      "busiest_day": "Monday",
      "narrative": "You completed 12 tasks this week, up from 9 last week..."
    }
  }
```

#### 1.4.7 Webhooks (Phase 2)

For integrating with external services:

```
POST   /v1/webhooks                 Register webhook URL
DELETE /v1/webhooks/:id             Remove webhook

Events:
  task.created, task.completed, task.updated, task.deleted
  project.created, project.updated, project.deleted

Payload:
{
  "event": "task.completed",
  "timestamp": "2026-02-25T10:30:00Z",
  "data": { /* full task object */ }
}
```

---

### 1.5 Web App Features (Primary Client — Build First)

The web app is the primary client. It ships before iOS because: iteration speed is unmatched (hot reload, no build signing), Claude Code's React/TypeScript accuracy is its absolute peak, and you avoid App Store review cycles during rapid development.

#### 1.5.1 Technology: React + Vite + TailwindCSS

| Choice | Why |
|---|---|
| **React 19** | Claude Code's single strongest framework. Massive training data. |
| **Vite** | Lightning-fast dev server and builds. Claude Code knows Vite config deeply. |
| **TailwindCSS** | Utility-first CSS. Claude Code generates excellent Tailwind markup. No context-switching to CSS files. |
| **TanStack Query** | Server state management with caching, optimistic updates, background refetch. Shared patterns with mobile later. |
| **TanStack Router** | Type-safe file-based routing. Excellent DX. Claude Code knows it well. |
| **Zustand** | Lightweight client state (UI state like selected project, sidebar open/closed). |
| **Shared Zod schemas** | Same validation logic as the API — imported from packages/shared. |

> **Why not Next.js?** For a personal tool backed by a dedicated API, Next.js adds unnecessary complexity (SSR, server components, API routes you won't use). A pure React SPA with Vite is simpler, faster to build, and Claude Code makes fewer mistakes with it. Your API is already on ECS Fargate — you don't need another server.

#### 1.5.2 Layout & Navigation

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                              ┌──────────────────┐  │
│  │ SIDEBAR  │         MAIN CONTENT         │   TASK DETAIL    │  │
│  │          │                              │   (slide-over)   │  │
│  │ ▶ Today  │  ┌────────────────────────┐  │                  │  │
│  │   Tomorrow│  │ 🔍 Quick Add Bar       │  │  Title           │  │
│  │   Next 7 │  │ "Buy milk tomorrow..." │  │  Description     │  │
│  │   ─────  │  ├────────────────────────┤  │  Due Date        │  │
│  │ ▶ Inbox  │  │                        │  │  Priority        │  │
│  │   ─────  │  │  🔴 Deploy hotfix   P1 │  │  Project         │  │
│  │ Projects │  │  🟠 Review PR #42   P2 │  │  Labels          │  │
│  │   Work   │  │  🔵 Update docs    P3 │  │  Subtasks        │  │
│  │   Personal│  │  ⚪ Buy groceries  P4 │  │  Duration        │  │
│  │   Health │  │                        │  │  Recurrence      │  │
│  │   ─────  │  │                        │  │  ──────          │  │
│  │ Labels   │  │                        │  │  Comments        │  │
│  │   @errands│  │                        │  │  Activity Log    │  │
│  │   @phone │  │                        │  │                  │  │
│  │   ─────  │  │                        │  │  [Delete]        │  │
│  │ 🤖 AI Chat│  │                        │  │                  │  │
│  └──────────┘  └────────────────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Keyboard shortcuts: Q=quick add  /=search  ⌘K=command bar   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Three-panel layout** (inspired by Todoist's web app):
- **Left sidebar**: Navigation — smart lists, projects, labels, AI chat link
- **Center panel**: Task list for current view, with quick-add bar at top
- **Right panel**: Task detail slide-over (opens when a task is clicked, closes on Escape)

#### 1.5.3 Key Screens & Components

| Screen / Component | Description |
|---|---|
| **Today View** | Default landing. Shows tasks due today + overdue, grouped by priority or time. |
| **Inbox View** | Tasks without a project. The "triage" screen. |
| **Project View** | Tasks in a specific project, optionally grouped by section. Toggle list/board view. |
| **Label View** | All tasks with a specific label. |
| **Search** | Full-text search with filter chips (project, label, priority, date range). |
| **AI Chat Panel** | Slide-out panel or dedicated route. Full conversational interface. |
| **Quick Add Bar** | Always visible at top of task list. NLP text input with parsed preview. |
| **Task Detail Slide-Over** | Right panel showing all task fields. Inline editing. |
| **Command Palette** | `⌘K` to open. Search tasks, navigate, quick actions. (Like Todoist/Linear) |
| **Settings** | API token display, theme (light/dark), timezone, default project. |

#### 1.5.4 Quick Add Bar (Web)

The web Quick Add Bar has more room than mobile, enabling a richer preview:

```
┌──────────────────────────────────────────────────────────┐
│ + │ Buy milk tomorrow #Shopping @errands p2               │
├──────────────────────────────────────────────────────────┤
│ Preview:                                                  │
│ 📝 Buy milk                                               │
│ 📅 Tomorrow (Feb 26)  🟠 P2  📁 Shopping  🏷️ errands     │
│                                              [Add Task]   │
└──────────────────────────────────────────────────────────┘
```

- Live preview updates as you type (debounced Claude API call for date parsing)
- `Enter` to submit, `Escape` to cancel
- Tab through fields to manually adjust any parsed value before submitting
- History: `↑` arrow recalls last quick-add input

#### 1.5.5 Keyboard Shortcuts

Essential for a power-user personal tool:

| Shortcut | Action |
|---|---|
| `Q` or `+` | Open Quick Add bar (focus input) |
| `⌘K` | Command palette |
| `/` | Focus search |
| `1`–`4` | Set priority on selected task |
| `E` | Edit selected task (open detail panel) |
| `⌘⏎` | Complete selected task |
| `⌘⌫` | Delete selected task |
| `T` | Set due date to today |
| `⌘↑` / `⌘↓` | Reorder task |
| `G` then `T` | Go to Today |
| `G` then `I` | Go to Inbox |
| `Esc` | Close detail panel / dismiss modal |

#### 1.5.6 AI Chat Panel (Web)

The web chat can be richer than mobile — render inline task cards with action buttons:

```
┌────────────────────────────────────────────┐
│  🤖 AI Task Assistant                [×]   │
├────────────────────────────────────────────┤
│                                            │
│  You: What's on my plate today?            │
│                                            │
│  AI: You have 4 tasks today:               │
│  ┌──────────────────────────────────────┐  │
│  │ 🔴 Deploy hotfix          due 10am  │  │
│  │    [Complete] [Reschedule] [Edit]    │  │
│  ├──────────────────────────────────────┤  │
│  │ 🟠 Review PR #42          due 2pm   │  │
│  │    [Complete] [Reschedule] [Edit]    │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  I'd suggest tackling the hotfix first,    │
│  then the PR review after lunch.           │
│                                            │
├────────────────────────────────────────────┤
│  [Message input]                     [→]   │
└────────────────────────────────────────────┘
```

Inline task cards in chat responses have **action buttons** that call the API directly — no need to navigate away.

#### 1.5.7 Board View (Kanban)

For project views with sections, offer a toggle between list and board:
- Columns map to sections within a project
- Drag-and-drop between columns using `@dnd-kit/core` (well-supported, Claude Code knows it)
- Cards show title, priority badge, due date, label chips

#### 1.5.8 Dark Mode

Implement with TailwindCSS `dark:` variant classes. Respect system preference by default, allow manual override stored in localStorage.

#### 1.5.9 Web Hosting

The web app is a static SPA — host on **S3 + CloudFront**:
- Build with Vite → static files
- Upload to S3 bucket
- CloudFront CDN in front with custom domain + HTTPS
- Cost: < $1/month for personal use
- Deploy via CDK (same infrastructure stack)

---

### 1.6 iOS App Features (Secondary Client — Build After Web)

The iOS app ships after the web app is stable. It shares the same API, Zod schemas, TanStack Query patterns, and Zustand stores via packages/shared.

#### 1.6.1 Code Sharing Between Web & iOS

| Shared (packages/shared) | Web Only | iOS Only |
|---|---|---|
| Zod schemas & types | React DOM components | React Native components |
| API client functions | TailwindCSS styling | Native styling (StyleSheet) |
| TanStack Query hooks | TanStack Router | Expo Router |
| Zustand stores | Keyboard shortcuts | Swipe gestures / Haptics |
| Constants & formatters | Command palette | Push notifications |
| | Board view (dnd-kit) | App Store submission |

Estimated code reuse: **40–50%** (all business logic, API layer, state management, query hooks).

#### 1.6.2 Tab Structure

| Tab | Screen | Core Function |
|---|---|---|
| **Today** | Today's tasks + overdue, grouped by time/priority | The "daily driver" view |
| **Inbox** | Unsorted tasks needing triage | Quick capture landing zone |
| **Projects** | Project list → task list → task detail | Browse/organize hierarchy |
| **Chat** | AI conversational interface | Natural language everything |
| **Search** | Global search with filters | Find anything |

#### 1.6.3 Key Interactions

**Quick Add Bar** — Always accessible from every screen (persistent bottom bar or floating action button):
- Tap → keyboard opens with NLP text input
- Type freely: "Dentist Tuesday 2pm #Health p1"
- Preview card shows parsed result before saving
- One-tap confirm or edit individual fields

**Swipe Actions** (per task row):
- Swipe right → Complete ✅
- Swipe left → Reschedule (quick date picker)
- Long press → Full edit sheet

**Pull to Refresh** — Standard iOS pattern, syncs with API

**Haptic Feedback** — Satisfying vibration on task completion (TickTick does this exceptionally well)

**Task Detail Sheet** — Bottom sheet (not full navigation) showing:
- Title (editable inline)
- Description (markdown editor)
- Due date/time picker
- Priority selector (4 colored circles)
- Project selector
- Label selector (multi-select chips)
- Subtasks list
- Duration estimate
- Recurrence picker
- Delete button

#### 1.6.4 AI Chat Screen (iOS)

The chat tab is a full conversational interface:

```
┌─────────────────────────────┐
│  🤖 AI Task Assistant       │
├─────────────────────────────┤
│                             │
│  You: What's left today?    │
│                             │
│  AI: You have 4 tasks:      │
│  🔴 Deploy hotfix (P1)      │
│  🟠 Review PR #42 (P2)      │
│  🔵 Update docs (P3)        │
│  ⚪ Buy groceries (P4)      │
│                             │
│  You: Complete the hotfix   │
│                             │
│  AI: ✅ Marked "Deploy      │
│  hotfix" as complete.       │
│  3 tasks remaining today.   │
│                             │
│  You: Push groceries to     │
│  Saturday                   │
│                             │
│  AI: 📅 Moved "Buy          │
│  groceries" to Saturday     │
│  Feb 28. Your today list    │
│  now has 2 tasks.           │
│                             │
├─────────────────────────────┤
│  [Message input field]  [→] │
└─────────────────────────────┘
```

Tasks mentioned in AI responses should be **tappable** — tapping opens the task detail sheet.

#### 1.6.5 Widgets (Phase 2)

iOS widgets using WidgetKit (supported by Expo with config plugins):
- **Small**: Task count for today + overdue count
- **Medium**: Today's top 3-5 tasks with checkboxes
- **Large**: Full today view with project grouping
- **Lock Screen**: Next upcoming task with due time

---

### 1.7 Phase 2 Features (Detailed)

#### 1.7.1 Calendar View

A day/week view showing tasks as time blocks (like Todoist's calendar, TickTick's timeline):
- Tasks with `due_time` + `duration_minutes` render as blocks
- All-day tasks appear at the top
- Drag to reschedule, drag edges to adjust duration
- Overlay with iOS calendar events (read-only, via EventKit)

#### 1.7.2 Pomodoro / Focus Timer

Inspired by TickTick's focus mode:
- Select a task → Start 25-minute focus timer
- Timer runs as a persistent notification (even backgrounded)
- Plays ambient sounds (rain, coffee shop, white noise) — optional
- Logs focus sessions: `focus_sessions` table with `task_id`, `started_at`, `duration`, `completed`
- Weekly focus time report via the AI summary

#### 1.7.3 Habit Tracker

Daily/weekly habits with streak tracking:
- Separate from tasks — habits don't have due dates, they have frequencies
- `habits` table: `id`, `name`, `frequency` (daily/weekly/N-per-week), `target_count`, `color`
- `habit_logs` table: `habit_id`, `date`, `completed`
- UI: grid/calendar view showing check marks, streak counter
- AI integration: "How are my habits going this month?"

#### 1.7.4 Eisenhower Matrix View

Four-quadrant view (from TickTick):
- **Q1 (Urgent + Important)**: P1 tasks due within 3 days
- **Q2 (Not Urgent + Important)**: P1-P2 tasks due later or no date
- **Q3 (Urgent + Not Important)**: P3-P4 tasks due within 3 days
- **Q4 (Not Urgent + Not Important)**: P3-P4 tasks due later or no date

This is purely a UI view — no data model changes needed, just query logic.

#### 1.7.5 Activity Log

Track all mutations for undo and history:
- `activity_log` table: `id`, `entity_type`, `entity_id`, `action` (created/updated/completed/deleted), `changes` (JSONB diff), `created_at`
- UI: timeline view per task showing full history
- Powers undo: replay the inverse of the last action

#### 1.7.6 iOS Shortcuts Integration

Expose your API to iOS Shortcuts (via Expo's IntentConfiguration or simple HTTP shortcut):
- "Add task" shortcut: text input → POST /v1/ai/quick-add
- "Today's tasks" shortcut: GET /v1/tasks?smart_list=today → display
- "Quick complete" shortcut: voice input → POST /v1/ai/chat with "complete [task]"
- Siri integration: "Hey Siri, add buy milk to my todo list" → triggers shortcut

#### 1.7.7 MCP Server

Expose your task API as an MCP (Model Context Protocol) server so you can manage tasks from Claude Desktop, Cursor, or any MCP-compatible AI client:
- Wrap your REST endpoints as MCP tools
- Enable natural language task management from any AI interface
- This is a TypeScript project — use the `@modelcontextprotocol/sdk` package

---

## 2. Recommended Tech Stack

### 2.1 The Guiding Principle

> **Choose the technology that Claude Code has the deepest training data on, the most community examples of, and the least likelihood of hallucinating about.**

This means: TypeScript everywhere, PostgreSQL over exotic databases, Express over niche frameworks, and React Native over Flutter for iOS.

### 2.2 Full Stack Overview

```
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│         Web Client              │  │        iOS Client             │
│   React + Vite + TailwindCSS    │  │   React Native + Expo        │
│   (S3 + CloudFront)             │  │   (App Store)                │
│  ┌───────────────────────────┐  │  │  ┌──────────────────────┐   │
│  │ TanStack Router + Query   │  │  │  │ Expo Router + Query  │   │
│  │ Zustand (state)           │  │  │  │ Zustand (state)      │   │
│  │ Shared Zod schemas        │  │  │  │ Shared Zod schemas   │   │
│  └───────────────────────────┘  │  │  └──────────────────────┘   │
└────────────────┬────────────────┘  └──────────────┬───────────────┘
                 │ HTTPS (REST JSON)                 │
                 └──────────────┬────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────┐
│                  AWS Infrastructure                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  ALB (Application Load Balancer) + HTTPS            │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  ECS Fargate (always-on container)                  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Node.js 20 + Express + TypeScript            │  │  │
│  │  │                                               │  │  │
│  │  │  ├── Auth Middleware (Bearer token)            │  │  │
│  │  │  ├── Zod Validation Middleware                 │  │  │
│  │  │  ├── CRUD Routes (/tasks, /projects, etc.)    │  │  │
│  │  │  ├── AI Routes (/ai/parse, /ai/chat)          │  │  │
│  │  │  ├── Prisma ORM → PostgreSQL                  │  │  │
│  │  │  └── Anthropic SDK → Claude API               │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                    │                    │                  │
│                    ▼                    ▼                  │
│  ┌──────────────────────┐  ┌────────────────────────┐    │
│  │  RDS PostgreSQL       │  │  Claude API (Anthropic) │    │
│  │  (db.t4g.micro)       │  │  Sonnet 4.5 model       │    │
│  │  via Prisma ORM       │  │  for NLP + chat          │    │
│  └──────────────────────┘  └────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Technology Choices — Detailed Rationale

#### Backend Runtime: ECS Fargate (Recommended over Lambda)

| Factor | ECS Fargate | Lambda |
|---|---|---|
| **Cold starts** | None — always running | 200-800ms on cold start |
| **Local dev** | Standard `npm run dev` | Needs SAM/serverless-offline |
| **Debugging** | Normal Node.js debugging | CloudWatch logs only |
| **WebSockets** | Supported (for real-time later) | Requires API Gateway WSS |
| **DB connections** | Persistent connection pool | Needs RDS Proxy ($) |
| **Cost (personal use)** | ~$9/mo for 0.25 vCPU, 512MB | Free tier, then ~$5/mo |
| **Complexity** | Docker + ECS config | Simpler deploy, more runtime gotchas |
| **Claude Code familiarity** | Very high (Express + Docker) | Very high (Lambda handlers) |

**Verdict**: For an advanced developer with no budget concern, Fargate gives a better development experience. You run a real Express server locally, deploy a Docker container, and never think about cold starts or connection pooling. Lambda remains a valid alternative.

#### Backend Framework: Express

Express is the most-documented Node.js framework in existence. Claude Code has near-perfect accuracy with Express routing, middleware, and error handling. Alternatives like Hono (faster, serverless-native) or Fastify (schema-based validation) are good but have less training data coverage.

#### ORM: Prisma

Type-safe queries generated from schema. Auto-generates TypeScript types. Migrations built in. Claude Code's strongest ORM by a wide margin. The schema-first approach is ideal: you define the data model in `schema.prisma`, and Prisma generates everything.

#### Database: PostgreSQL on RDS

Relational model maps perfectly to task management. Full-text search built in. JSONB for flexible fields (recurrence rules, activity log changes). Claude Code writes excellent PostgreSQL/Prisma queries. DynamoDB was rejected because single-table design is error-prone and relational queries (tasks with labels, filtered by project) are painful.

#### AI: Claude API via Anthropic SDK

Claude Sonnet 4.5 offers the best balance of speed, intelligence, and cost for structured extraction. Tool use (function calling) forces structured JSON output with no parsing needed. The Anthropic TypeScript SDK is first-party, well-maintained, and deeply known by Claude Code. Estimated cost at 50 interactions/day: ~$12/month.

#### Auth: Simple Bearer Token

```typescript
// middleware/auth.ts — single-user, no Cognito needed
const AUTH_TOKEN = process.env.API_TOKEN; // stored in AWS Secrets Manager

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
  next();
};
```

If you later want biometric auth on iOS, upgrade to a self-issued JWT with a refresh token — still no Cognito.

#### Web Client: React + Vite + TailwindCSS

| Choice | Why |
|---|---|
| **React 19 + Vite** | Claude Code's absolute strongest combination. Near-zero hallucination rate. Hot module reload for instant feedback. |
| **TailwindCSS** | Claude Code generates excellent Tailwind. No separate CSS files to manage. Dark mode built in. |
| **TanStack Router** | Type-safe, file-based routing. Excellent DX. Better than React Router for type safety. |
| **TanStack Query** | Server state with caching, optimistic updates, background refetch. Same patterns reused in iOS later. |
| **@dnd-kit/core** | Drag-and-drop for board view and task reordering. Well-documented, Claude Code knows it. |
| **cmdk** | Command palette component (⌘K). Used by Linear, Vercel. Tiny and well-supported. |

> **Why not Next.js?** Your API already lives on ECS Fargate. Adding Next.js means a second server, SSR complexity, and server component decisions that don't benefit a single-user SPA. Vite builds a static bundle → S3 + CloudFront → done. Simpler, faster, fewer Claude Code mistakes.

#### iOS Client: React Native + Expo

Same language as backend (TypeScript). Expo eliminates 90% of native config pain. EAS Build handles Xcode. OTA updates for quick iteration. Expo Router provides file-based navigation. TanStack Query handles server state with caching and optimistic updates. Zustand provides lightweight client state.

#### Shared Types: npm Workspaces

```typescript
// packages/shared/src/schemas/task.ts
import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  project_id: z.string().uuid().optional(),
  priority: z.number().int().min(1).max(4).default(4),
  due_date: z.string().date().optional(),
  due_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  labels: z.array(z.string()).optional(),
  duration_minutes: z.number().int().positive().optional(),
  recurrence_rule: z.string().optional(),
  parent_id: z.string().uuid().optional(),
  section_id: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
// This type is used by BOTH the backend (validation) and mobile (form state)
```

---

## 3. Data Model (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id              String    @id @default(uuid())
  name            String
  color           String?
  icon            String?
  description     String?
  isInbox         Boolean   @default(false) @map("is_inbox")
  isArchived      Boolean   @default(false) @map("is_archived")
  viewStyle       String    @default("list") @map("view_style")
  defaultPriority Int       @default(4) @map("default_priority")
  sortOrder       Int       @default(0) @map("sort_order")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  tasks           Task[]
  sections        Section[]

  @@map("projects")
}

model Task {
  id              String    @id @default(uuid())
  title           String
  description     String?
  priority        Int       @default(4)
  dueDate         DateTime? @map("due_date") @db.Date
  dueTime         String?   @map("due_time")
  dueDatetime     DateTime? @map("due_datetime")
  durationMinutes Int?      @map("duration_minutes")
  isRecurring     Boolean   @default(false) @map("is_recurring")
  recurrenceRule  String?   @map("recurrence_rule")
  isCompleted     Boolean   @default(false) @map("is_completed")
  completedAt     DateTime? @map("completed_at")
  sortOrder       Int       @default(0) @map("sort_order")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  project         Project   @relation(fields: [projectId], references: [id])
  projectId       String    @map("project_id")

  parent          Task?     @relation("Subtasks", fields: [parentId], references: [id])
  parentId        String?   @map("parent_id")
  subtasks        Task[]    @relation("Subtasks")

  section         Section?  @relation(fields: [sectionId], references: [id])
  sectionId       String?   @map("section_id")

  labels          TaskLabel[]
  comments        Comment[]
  activityLogs    ActivityLog[]
  focusSessions   FocusSession[]

  @@index([projectId])
  @@index([isCompleted, dueDate])
  @@index([isCompleted, priority])
  @@map("tasks")
}

model Label {
  id        String      @id @default(uuid())
  name      String      @unique
  color     String?
  createdAt DateTime    @default(now()) @map("created_at")
  tasks     TaskLabel[]
  @@map("labels")
}

model TaskLabel {
  taskId  String @map("task_id")
  labelId String @map("label_id")
  task    Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label   Label  @relation(fields: [labelId], references: [id], onDelete: Cascade)
  @@id([taskId, labelId])
  @@map("task_labels")
}

model Section {
  id        String   @id @default(uuid())
  name      String
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String   @map("project_id")
  tasks     Task[]
  @@map("sections")
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    String   @map("task_id")
  @@map("comments")
}

model ChatMessage {
  id             String   @id @default(uuid())
  conversationId String   @map("conversation_id")
  role           String   // "user" | "assistant"
  content        String
  mutations      Json?    // Record of any task changes made
  createdAt      DateTime @default(now()) @map("created_at")
  @@index([conversationId, createdAt])
  @@map("chat_messages")
}

model ActivityLog {
  id         String   @id @default(uuid())
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  action     String   // "created" | "updated" | "completed" | "deleted"
  changes    Json?    // { field: { old: value, new: value } }
  createdAt  DateTime @default(now()) @map("created_at")
  task       Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  taskId     String?  @map("task_id")
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("activity_log")
}

model FocusSession {
  id               String    @id @default(uuid())
  durationMinutes  Int       @map("duration_minutes")
  completedMinutes Int       @default(0) @map("completed_minutes")
  startedAt        DateTime  @map("started_at")
  completedAt      DateTime? @map("completed_at")
  task             Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId           String    @map("task_id")
  @@map("focus_sessions")
}
```

---

## 4. Project Structure

```
todo-app/
├── CLAUDE.md                         # Claude Code project context
├── docker-compose.yml                # Local dev: PostgreSQL + app
├── Dockerfile                        # Production API container
├── package.json                      # Monorepo root (npm workspaces)
├── tsconfig.base.json                # Shared TS config
│
├── packages/
│   ├── shared/                       # Shared types, schemas, constants
│   │   ├── src/
│   │   │   ├── schemas/              # Zod schemas (api + web + mobile)
│   │   │   │   ├── task.ts
│   │   │   │   ├── project.ts
│   │   │   │   ├── label.ts
│   │   │   │   └── ai.ts
│   │   │   ├── types/
│   │   │   │   ├── api.ts            # Request/response types
│   │   │   │   └── entities.ts       # Task, Project, Label types
│   │   │   ├── constants/
│   │   │   │   ├── priorities.ts
│   │   │   │   ├── colors.ts
│   │   │   │   └── smart-lists.ts
│   │   │   └── hooks/                # Shared TanStack Query hooks
│   │   │       ├── useTasks.ts       # (used by BOTH web and mobile)
│   │   │       ├── useProjects.ts
│   │   │       └── useAI.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                          # Backend (Express + Prisma)
│   │   ├── src/
│   │   │   ├── index.ts              # Express app + server
│   │   │   ├── routes/
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── labels.ts
│   │   │   │   ├── sections.ts
│   │   │   │   ├── comments.ts
│   │   │   │   └── ai.ts
│   │   │   ├── services/
│   │   │   │   ├── task.service.ts
│   │   │   │   ├── nlp.service.ts    # Claude NLP parsing
│   │   │   │   ├── chat.service.ts   # Claude chat management
│   │   │   │   └── recurrence.service.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── validate.ts
│   │   │   │   └── error-handler.ts
│   │   │   └── prisma/
│   │   │       ├── schema.prisma
│   │   │       └── seed.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                          # Web App (React + Vite)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── src/
│   │   │   ├── main.tsx              # App entry point
│   │   │   ├── router.tsx            # TanStack Router config
│   │   │   ├── routes/               # File-based routes
│   │   │   │   ├── __root.tsx        # Root layout (sidebar + main)
│   │   │   │   ├── index.tsx         # Redirects to /today
│   │   │   │   ├── today.tsx         # Today smart list
│   │   │   │   ├── inbox.tsx         # Inbox view
│   │   │   │   ├── upcoming.tsx      # Next 7 days view
│   │   │   │   ├── project.$id.tsx   # Project detail view
│   │   │   │   ├── label.$name.tsx   # Label filter view
│   │   │   │   ├── search.tsx        # Search + filters
│   │   │   │   └── chat.tsx          # AI chat full page
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── TaskList.tsx
│   │   │   │   │   └── TaskDetail.tsx    # Slide-over panel
│   │   │   │   ├── task/
│   │   │   │   │   ├── TaskRow.tsx
│   │   │   │   │   ├── TaskForm.tsx
│   │   │   │   │   ├── QuickAddBar.tsx
│   │   │   │   │   ├── PriorityBadge.tsx
│   │   │   │   │   ├── DatePicker.tsx
│   │   │   │   │   └── LabelChips.tsx
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatPanel.tsx
│   │   │   │   │   ├── ChatBubble.tsx
│   │   │   │   │   └── TaskCard.tsx      # Inline task in chat
│   │   │   │   ├── board/
│   │   │   │   │   ├── BoardView.tsx
│   │   │   │   │   └── BoardColumn.tsx
│   │   │   │   └── CommandPalette.tsx     # ⌘K palette
│   │   │   ├── services/
│   │   │   │   └── api.ts            # Fetch client with auth
│   │   │   ├── store/
│   │   │   │   └── app.ts            # Zustand (UI state)
│   │   │   └── styles/
│   │   │       └── globals.css        # Tailwind base imports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                       # iOS App (React Native + Expo)
│       ├── app/                      # Expo Router
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx
│       │   │   ├── today.tsx
│       │   │   ├── inbox.tsx
│       │   │   ├── projects.tsx
│       │   │   ├── chat.tsx
│       │   │   └── search.tsx
│       │   ├── project/[id].tsx
│       │   ├── task/[id].tsx
│       │   └── _layout.tsx
│       ├── components/
│       │   ├── TaskRow.tsx
│       │   ├── TaskForm.tsx
│       │   ├── QuickAddBar.tsx
│       │   ├── PriorityPicker.tsx
│       │   ├── DatePicker.tsx
│       │   ├── LabelChips.tsx
│       │   ├── ProjectPicker.tsx
│       │   ├── ChatBubble.tsx
│       │   └── EmptyState.tsx
│       ├── services/
│       │   └── api.ts
│       ├── store/
│       │   └── app.ts               # Zustand
│       ├── app.json
│       └── package.json
│
└── infrastructure/                   # AWS CDK (TypeScript)
    ├── lib/
    │   ├── stack.ts
    │   ├── ecs.ts                    # API on Fargate
    │   ├── rds.ts                    # PostgreSQL
    │   ├── web-hosting.ts            # S3 + CloudFront for web app
    │   └── networking.ts             # VPC, ALB, security groups
    ├── cdk.json
    └── package.json
```

---

## 5. AWS Architecture & Costs

| Service | Purpose | Est. Monthly Cost |
|---|---|---|
| **ECS Fargate** | API container (0.25 vCPU, 512MB) | ~$9 |
| **RDS PostgreSQL** | Database (db.t4g.micro, 20GB) | ~$15 |
| **ALB** | Load balancer + HTTPS for API | ~$16 |
| **S3 + CloudFront** | Web app static hosting + CDN | < $1 |
| **ECR** | Docker image registry | < $1 |
| **Route 53** | Custom domain (api + web) | $1 |
| **ACM** | SSL certificates | Free |
| **Secrets Manager** | API keys | ~$1 |
| **CloudWatch** | Logging | ~$2 |
| **Anthropic API** | Claude (~50 calls/day) | ~$12 |
| **Total** | | **~$57–62/month** |

Deploy via **AWS CDK (TypeScript)** — infrastructure as code in the same language as your app.

---

## 6. CLAUDE.md Template

```markdown
# Todo App — AI-Powered Personal Task Manager

## Tech Stack
- Backend: TypeScript, Node.js 20, Express, Prisma ORM, Zod
- Database: PostgreSQL 16 (AWS RDS)
- AI: Anthropic Claude API (Sonnet 4.5) via tool_use
- Auth: Bearer token (single user, no Cognito)
- Hosting: AWS ECS Fargate + ALB (API), S3 + CloudFront (web), via AWS CDK
- Web: React 19 + Vite + TailwindCSS, TanStack Router + Query, Zustand
- Mobile: React Native + Expo, Expo Router, TanStack Query, Zustand
- Monorepo: npm workspaces (packages/shared, packages/api, packages/web, packages/mobile)

## Architecture
- Shared types, Zod schemas, and TanStack Query hooks in packages/shared
- API routes in packages/api/src/routes/ (Express Router)
- Business logic in packages/api/src/services/
- Prisma schema in packages/api/src/prisma/schema.prisma
- Web app uses TanStack Router (file-based) in packages/web/src/routes/
- Mobile uses Expo Router in packages/mobile/app/
- Infrastructure in infrastructure/ (AWS CDK TypeScript)

## Database
- Single-user app (no user_id columns needed)
- All IDs are UUID v4 strings
- Timestamps are ISO 8601 UTC
- Recurrence uses RRULE format (RFC 5545)
- Labels are many-to-many via task_labels join table

## API Conventions
- Base path: /v1
- Auth: Authorization: Bearer <token>
- Success: { data: T } or { data: T[], cursor: string }
- Errors: { error: { code: string, message: string } }

## Rules
- Always use TypeScript strict mode
- Validate ALL API inputs with Zod schemas from packages/shared
- Use Prisma for all DB operations (no raw SQL)
- Priority: 1 (urgent/red) to 4 (none/gray)
- Inbox project (isInbox=true) always exists, cannot be deleted
- Tasks without project_id go to Inbox
- Completing a recurring task creates next instance
- Use 'rrule' npm package for recurrence computation
- Use Anthropic SDK tool_use for structured Claude output
- Web uses TailwindCSS utility classes (no separate CSS files)
- Web uses TanStack Router for routing (NOT React Router)

## Commands
- Dev API: docker-compose up (Postgres + API)
- Dev API only: cd packages/api && npm run dev
- Dev Web: cd packages/web && npm run dev
- Dev Mobile: cd packages/mobile && npx expo start
- Prisma generate: cd packages/api && npx prisma generate
- Migrate: cd packages/api && npx prisma migrate dev
- Build Web: cd packages/web && npm run build
- Deploy: cd infrastructure && npx cdk deploy
- Test: npm test
```

---

## 7. Development Phases

### Phase 1: Backend API + Database (Week 1–2)
1. Initialize monorepo with npm workspaces
2. Create packages/shared with Zod schemas and TypeScript types
3. Define Prisma schema, run initial migration, seed Inbox project
4. Build CRUD routes: tasks, projects, labels, sections
5. Add auth middleware (bearer token) + Zod validation middleware
6. Implement NLP service (Claude API task parsing via tool_use)
7. Implement quick-add endpoint (parse + create)
8. Docker-compose for local dev
9. Test all endpoints

### Phase 2: AI Chat + Smart Lists (Week 2–3)
1. Implement chat service with Claude tools for CRUD
2. Add conversation persistence
3. Implement all smart list queries
4. Add PostgreSQL full-text search
5. Implement recurring task completion logic
6. Add activity log
7. Deploy API to AWS via CDK

### Phase 3: Web App (Week 3–5)
1. Initialize Vite + React + TailwindCSS project
2. Set up TanStack Router with file-based routes
3. Build three-panel layout: sidebar, task list, detail slide-over
4. Build API client + TanStack Query hooks (in packages/shared for reuse)
5. Build Today, Inbox, Projects, Search views
6. Build Quick Add Bar with live NLP preview
7. Build Task Detail slide-over with inline editing
8. Build AI Chat panel with inline task cards + action buttons
9. Build Board/Kanban view with drag-and-drop (dnd-kit)
10. Add Command Palette (⌘K) with cmdk
11. Add keyboard shortcuts
12. Dark mode (TailwindCSS dark: variants)
13. Deploy to S3 + CloudFront via CDK

### Phase 4: iOS App (Week 5–7)
1. Initialize Expo project with TypeScript
2. Set up Expo Router with tab navigation
3. Reuse TanStack Query hooks + Zustand stores from packages/shared
4. Build Today, Inbox, Projects, Search, Chat screens
5. Build Quick Add Bar adapted for mobile
6. Build Task Detail bottom sheet
7. Swipe actions (complete, reschedule), haptic feedback
8. Pull-to-refresh, optimistic updates
9. Push notifications (Expo Push)

### Phase 5: Polish & Submit (Week 7–8)
1. App icon, splash screen for iOS
2. Empty states, loading skeletons (web + mobile)
3. Basic offline queue for iOS
4. TestFlight → App Store submission
5. Privacy policy page (hosted on web)

### Phase 6: Enhancements (Ongoing)
1. Calendar view (web first, then mobile)
2. Pomodoro timer
3. iOS Widgets (WidgetKit)
4. iOS Shortcuts integration
5. Habit tracker, focus session tracking
6. MCP server for Claude Desktop integration
7. Eisenhower Matrix view
8. Weekly AI-generated productivity reports

---

## 8. Key References

| Resource | Why It's Useful |
|---|---|
| **Todoist REST API v2** (developer.todoist.com) | Gold standard API design for task management |
| **TickTick features** (ticktick.com/features) | Inspiration for Pomodoro, habits, Eisenhower |
| **hpfpv/todo-app-aws** on GitHub | Full AWS serverless todo reference |
| **greirson/mcp-todoist** on GitHub | Claude + Todoist NLP patterns |
| **rrule npm package** | RRULE computation in TypeScript |
| **Prisma docs** (prisma.io/docs) | ORM reference |
| **Expo docs** (docs.expo.dev) | React Native + Expo reference |
| **AWS CDK docs** | Infrastructure as code |

---

## 9. Summary

| Decision | Recommendation | Confidence |
|---|---|---|
| Backend Language | **TypeScript** | 🟢 Very High |
| Backend Framework | **Express** | 🟢 Very High |
| Database | **PostgreSQL + Prisma** | 🟢 Very High |
| AI/NLP | **Claude Sonnet 4.5 with tool_use** | 🟢 Very High |
| Auth | **Bearer token** (single user) | 🟢 Very High |
| Compute | **ECS Fargate** (always-on) | 🟢 Very High |
| Infrastructure | **AWS CDK (TypeScript)** | 🟢 Very High |
| Web Framework | **React 19 + Vite + TailwindCSS** | 🟢 Very High |
| Web Routing | **TanStack Router** | 🟢 Very High |
| iOS Framework | **React Native + Expo** | 🟢 Very High |
| State Management | **TanStack Query + Zustand** (shared web + iOS) | 🟢 Very High |
| Monorepo | **npm workspaces** | 🟢 Very High |
| Validation | **Zod (shared api + web + mobile)** | 🟢 Very High |
| Web Hosting | **S3 + CloudFront** | 🟢 Very High |

Every choice prioritizes Claude Code's reliability — these are the tools with the deepest training data and the most predictable outputs. The web app ships first because Claude Code is at peak accuracy with React + Vite + Tailwind, iteration is instant, and there's no App Store gatekeeping. The architecture is intentionally boring, because boring technology ships.
