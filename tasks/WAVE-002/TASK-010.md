# TASK-010: Implement NLP Service (Claude API parsing)

## Status: blocked

## Dependencies

- WAVE-001 complete

## Description

Create an NLP service that uses Claude API to parse natural language task descriptions into structured task data.

## Files to Create

```
packages/api/src/
├── services/
│   └── nlpService.ts
├── prompts/
│   └── taskParser.ts
└── types/
    └── nlp.ts
```

## Implementation

### NLP Service

```typescript
// services/nlpService.ts
import Anthropic from '@anthropic-ai/sdk';
import { CreateTask } from '@taskflow/shared';
import { taskParserPrompt } from '../prompts/taskParser';

const anthropic = new Anthropic();

export interface ParsedTask {
  content: string;
  dueDate?: string;
  dueTime?: string;
  priority?: 'p1' | 'p2' | 'p3' | 'p4';
  project?: string;
  labels?: string[];
  recurrence?: string;
}

export async function parseTaskText(
  text: string,
  context?: { projects: string[]; labels: string[] }
): Promise<ParsedTask> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: taskParserPrompt,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          input: text,
          availableProjects: context?.projects || [],
          availableLabels: context?.labels || [],
          currentDate: new Date().toISOString()
        })
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}
```

### Task Parser Prompt

```typescript
// prompts/taskParser.ts
export const taskParserPrompt = `You are a task parser. Given natural language input, extract structured task data.

Input format (JSON):
- input: The natural language task description
- availableProjects: Array of existing project names
- availableLabels: Array of existing label names
- currentDate: Current ISO datetime

Output format (JSON):
{
  "content": "The task title (required)",
  "dueDate": "ISO date string (optional)",
  "dueTime": "HH:mm format (optional)",
  "priority": "p1|p2|p3|p4 (optional, p1=urgent, p4=no priority)",
  "project": "project name if mentioned (optional)",
  "labels": ["label names if mentioned"] (optional),
  "recurrence": "daily|weekly|monthly|yearly (optional)"
}

Examples:
- "Buy milk tomorrow" → {"content": "Buy milk", "dueDate": "<tomorrow's date>"}
- "Call mom at 3pm !!" → {"content": "Call mom", "dueTime": "15:00", "priority": "p1"}
- "Review PR #work" → {"content": "Review PR", "labels": ["work"]}
- "Meeting every Monday" → {"content": "Meeting", "recurrence": "weekly"}

Priority indicators:
- "!!" or "urgent" or "asap" → p1
- "!" or "important" → p2
- Default → p4

Respond ONLY with valid JSON, no explanation.`;
```

## Acceptance Criteria

1. [ ] Parses task content correctly
2. [ ] Extracts due dates (today, tomorrow, next week, specific dates)
3. [ ] Extracts due times
4. [ ] Identifies priority from markers (!!, !)
5. [ ] Matches against available projects/labels
6. [ ] Handles recurrence patterns
7. [ ] Returns valid JSON

## Verification

```typescript
// Test cases
const tests = [
  { input: "Buy milk tomorrow", expect: { content: "Buy milk", dueDate: "..." } },
  { input: "Call mom at 3pm !!", expect: { content: "Call mom", priority: "p1" } },
  { input: "Review PR #work", expect: { content: "Review PR", labels: ["work"] } }
];
```
