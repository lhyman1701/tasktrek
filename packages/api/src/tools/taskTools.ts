import { Tool } from '@anthropic-ai/sdk/resources/messages';

export const taskTools: Tool[] = [
  {
    name: 'create_task',
    description: 'Create a new task for the user',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The task content/title' },
        dueDate: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DD)' },
        dueTime: { type: 'string', description: 'Due time in HH:mm format' },
        priority: { type: 'string', enum: ['p1', 'p2', 'p3', 'p4'], description: 'Priority level (p1=urgent, p4=normal)' },
        projectId: { type: 'string', description: 'Project UUID to add task to' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Label IDs to attach' }
      },
      required: ['content']
    }
  },
  {
    name: 'complete_task',
    description: 'Mark a task as complete',
    input_schema: {
      type: 'object' as const,
      properties: {
        taskId: { type: 'string', description: 'The task UUID to complete' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'reopen_task',
    description: 'Reopen a completed task',
    input_schema: {
      type: 'object' as const,
      properties: {
        taskId: { type: 'string', description: 'The task UUID to reopen' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    input_schema: {
      type: 'object' as const,
      properties: {
        taskId: { type: 'string', description: 'The task UUID to update' },
        content: { type: 'string', description: 'New task content' },
        dueDate: { type: 'string', description: 'New due date in ISO format' },
        priority: { type: 'string', enum: ['p1', 'p2', 'p3', 'p4'], description: 'New priority' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'delete_task',
    description: 'Delete a task',
    input_schema: {
      type: 'object' as const,
      properties: {
        taskId: { type: 'string', description: 'The task UUID to delete' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'list_tasks',
    description: 'List tasks with optional filters',
    input_schema: {
      type: 'object' as const,
      properties: {
        filter: {
          type: 'string',
          enum: ['today', 'tomorrow', 'upcoming', 'overdue', 'completed', 'all'],
          description: 'Filter type for tasks'
        },
        projectId: { type: 'string', description: 'Filter by project UUID' },
        limit: { type: 'number', description: 'Maximum number of tasks to return' }
      }
    }
  },
  {
    name: 'search_tasks',
    description: 'Search tasks by content',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Maximum results' }
      },
      required: ['query']
    }
  }
];
