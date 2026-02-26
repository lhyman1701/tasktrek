# TASK-013: Implement Chat Service with Claude Tools

## Status: blocked

## Dependencies

- TASK-010: NLP Service

## Description

Create a chat service that uses Claude's tool use feature to manage tasks through natural conversation.

## Files to Create

```
packages/api/src/
├── services/
│   └── chatService.ts
├── tools/
│   ├── index.ts
│   ├── taskTools.ts
│   ├── projectTools.ts
│   └── queryTools.ts
└── routes/
    └── chat.ts
```

## Tool Definitions

```typescript
// tools/taskTools.ts
import { Tool } from '@anthropic-ai/sdk/resources/messages';

export const taskTools: Tool[] = [
  {
    name: 'create_task',
    description: 'Create a new task',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Task content' },
        dueDate: { type: 'string', description: 'ISO date' },
        priority: { type: 'string', enum: ['p1', 'p2', 'p3', 'p4'] },
        projectId: { type: 'string', description: 'Project UUID' },
        labels: { type: 'array', items: { type: 'string' } }
      },
      required: ['content']
    }
  },
  {
    name: 'complete_task',
    description: 'Mark a task as complete',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task UUID' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'list_tasks',
    description: 'List tasks with optional filters',
    input_schema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['today', 'upcoming', 'overdue', 'all'],
          description: 'Filter type'
        },
        projectId: { type: 'string' },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    input_schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        content: { type: 'string' },
        dueDate: { type: 'string' },
        priority: { type: 'string' }
      },
      required: ['taskId']
    }
  }
];
```

## Chat Service

```typescript
// services/chatService.ts
import Anthropic from '@anthropic-ai/sdk';
import { taskTools } from '../tools/taskTools';
import { executeToolCall } from '../tools';

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are TaskFlow, an AI assistant for task management.
You can help users:
- Create, update, and complete tasks
- List tasks by various filters
- Manage projects and labels

Be concise and helpful. When creating tasks, confirm what was created.
When listing tasks, format them clearly.`;

export async function chat(
  userId: string,
  message: string,
  history: Message[]
): Promise<{ response: string; actions: Action[] }> {
  const messages = [
    ...history,
    { role: 'user' as const, content: message }
  ];

  const actions: Action[] = [];

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: taskTools,
    messages
  });

  // Process tool calls
  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter(
      c => c.type === 'tool_use'
    );

    const toolResults = await Promise.all(
      toolUses.map(async (toolUse) => {
        const result = await executeToolCall(
          userId,
          toolUse.name,
          toolUse.input
        );
        actions.push({
          tool: toolUse.name,
          input: toolUse.input,
          result
        });
        return {
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        };
      })
    );

    messages.push(
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults }
    );

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: taskTools,
      messages
    });
  }

  const textContent = response.content.find(c => c.type === 'text');
  return {
    response: textContent?.text || '',
    actions
  };
}
```

## Acceptance Criteria

1. [ ] Tool definitions for CRUD operations
2. [ ] Chat handles multi-turn conversations
3. [ ] Tools execute against real database
4. [ ] Actions logged for audit
5. [ ] Errors handled gracefully
6. [ ] Response formatted for display
