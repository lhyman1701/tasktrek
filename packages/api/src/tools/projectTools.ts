import { Tool } from '@anthropic-ai/sdk/resources/messages';

export const projectTools: Tool[] = [
  {
    name: 'list_projects',
    description: 'List all projects for the user',
    input_schema: {
      type: 'object' as const,
      properties: {
        includeArchived: { type: 'boolean', description: 'Include archived projects' }
      }
    }
  },
  {
    name: 'create_project',
    description: 'Create a new project',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Project name' },
        color: { type: 'string', description: 'Project color' }
      },
      required: ['name']
    }
  },
  {
    name: 'list_labels',
    description: 'List all labels for the user',
    input_schema: {
      type: 'object' as const,
      properties: {}
    }
  },
  {
    name: 'create_label',
    description: 'Create a new label',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Label name' },
        color: { type: 'string', description: 'Label color' }
      },
      required: ['name']
    }
  }
];
