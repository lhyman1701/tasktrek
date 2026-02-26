# TASK-002: Create Shared Package with Zod Schemas

## Status: blocked

## Dependencies

- TASK-001: Initialize Monorepo

## Description

Create the shared package containing Zod schemas for all API entities. These schemas will be used for both API validation and TypeScript type inference.

## Files to Create/Modify

```
packages/shared/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts           # Main exports
    ├── schemas/
    │   ├── index.ts       # Schema exports
    │   ├── task.ts        # Task schema
    │   ├── project.ts     # Project schema
    │   ├── label.ts       # Label schema
    │   ├── section.ts     # Section schema
    │   └── user.ts        # User schema
    └── types/
        └── index.ts       # Inferred types export
```

## Schema Definitions

### Task Schema (task.ts)

```typescript
import { z } from 'zod';

export const TaskPrioritySchema = z.enum(['p1', 'p2', 'p3', 'p4']);

export const CreateTaskSchema = z.object({
  content: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  labels: z.array(z.string().uuid()).optional(),
  priority: TaskPrioritySchema.optional().default('p4'),
  dueDate: z.string().datetime().optional(),
  dueString: z.string().optional(), // For NLP parsing
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskSchema = CreateTaskSchema.extend({
  id: z.string().uuid(),
  isCompleted: z.boolean(),
  order: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
```

### Project Schema (project.ts)

```typescript
import { z } from 'zod';

export const ProjectColorSchema = z.enum([
  'berry_red', 'red', 'orange', 'yellow', 'olive_green',
  'lime_green', 'green', 'mint_green', 'teal', 'sky_blue',
  'light_blue', 'blue', 'grape', 'violet', 'lavender',
  'magenta', 'salmon', 'charcoal', 'grey', 'taupe'
]);

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  color: ProjectColorSchema.optional().default('charcoal'),
  parentId: z.string().uuid().optional(),
  isFavorite: z.boolean().optional().default(false),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const ProjectSchema = CreateProjectSchema.extend({
  id: z.string().uuid(),
  order: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
```

## Acceptance Criteria

1. [ ] All entity schemas defined with Zod
2. [ ] Create/Update/Full schemas for each entity
3. [ ] TypeScript types inferred from schemas
4. [ ] Package exports all schemas and types
5. [ ] `npm run build` succeeds in shared package
6. [ ] API package can import schemas via workspace protocol

## Verification

```bash
cd packages/shared
npm run build
npm run typecheck

# Test import from api package
cd ../api
# Verify import works: import { CreateTaskSchema } from '@taskflow/shared'
```

## Notes

- Use `z.infer<typeof Schema>` for type inference
- Export both schemas and types from index.ts
- Consider adding JSDoc comments for better IDE support
