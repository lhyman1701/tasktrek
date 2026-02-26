# TASK-006: Add Zod Validation Middleware

## Status: blocked

## Dependencies

- TASK-002: Create Shared Package with Zod Schemas
- TASK-004: Build Express App Foundation

## Description

Create reusable middleware that validates request body, query, and params using Zod schemas from the shared package.

## Files to Create/Modify

```
packages/api/src/
├── middleware/
│   └── validate.ts       # Validation middleware factory
└── routes/
    └── tasks.ts          # Example usage
```

## Implementation Details

### Validation Middleware (validate.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(options: ValidateOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }
      if (options.query) {
        req.query = await options.query.parseAsync(req.query);
      }
      if (options.params) {
        req.params = await options.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

// Convenience wrappers
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate({ body: schema });
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate({ query: schema });
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return validate({ params: schema });
}
```

### UUID Param Schema

```typescript
// packages/shared/src/schemas/common.ts
import { z } from 'zod';

export const UuidParamSchema = z.object({
  id: z.string().uuid()
});

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});
```

### Example Route Usage

```typescript
// routes/tasks.ts
import { Router } from 'express';
import { validate, validateBody, validateParams } from '../middleware/validate';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UuidParamSchema,
  PaginationQuerySchema
} from '@taskflow/shared';

const router = Router();

router.post('/',
  validateBody(CreateTaskSchema),
  async (req, res) => {
    // req.body is typed and validated
    const task = await createTask(req.user!.id, req.body);
    res.status(201).json(task);
  }
);

router.get('/:id',
  validateParams(UuidParamSchema),
  async (req, res) => {
    // req.params.id is validated UUID
    const task = await getTask(req.params.id);
    res.json(task);
  }
);

router.patch('/:id',
  validate({
    params: UuidParamSchema,
    body: UpdateTaskSchema
  }),
  async (req, res) => {
    const task = await updateTask(req.params.id, req.body);
    res.json(task);
  }
);
```

## Acceptance Criteria

1. [ ] Middleware factory accepts body, query, params schemas
2. [ ] Invalid data returns 400 with detailed errors
3. [ ] Valid data passes through parsed
4. [ ] Type inference works with validated data
5. [ ] Convenience wrappers work correctly
6. [ ] Error format is consistent and API-friendly

## Verification

```bash
# Test invalid body
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": ""}'  # Should fail: content too short

# Test invalid UUID param
curl http://localhost:3000/api/tasks/not-a-uuid \
  -H "Authorization: Bearer <token>"  # Should fail: invalid UUID

# Test valid request
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Valid task"}'  # Should succeed
```

## Notes

- Parsed data replaces raw data in req.body/query/params
- Schema transforms (coerce, default) are applied
- Consider adding sanitization for XSS prevention
