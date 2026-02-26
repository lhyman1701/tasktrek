# TASK-005: Add Auth Middleware (Bearer Token)

## Status: blocked

## Dependencies

- TASK-004: Build Express App Foundation

## Description

Implement bearer token authentication middleware that validates API tokens against the User table.

## Files to Create/Modify

```
packages/api/src/
├── middleware/
│   └── auth.ts           # Auth middleware
├── types/
│   └── express.d.ts      # Extend Express Request
└── routes/
    └── index.ts          # Apply auth to protected routes
```

## Implementation Details

### Auth Middleware (auth.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { AppError } from './errorHandler';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    const user = await prisma.user.findUnique({
      where: { apiToken: token },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      throw new AppError(401, 'Invalid API token');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
```

### Express Type Extension (express.d.ts)

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string | null;
      };
    }
  }
}

export {};
```

### Route Protection

```typescript
// routes/index.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import healthRoutes from './health';
import taskRoutes from './tasks';
import projectRoutes from './projects';

const router = Router();

// Public routes
router.use(healthRoutes);

// Protected routes
router.use('/tasks', authMiddleware, taskRoutes);
router.use('/projects', authMiddleware, projectRoutes);
router.use('/labels', authMiddleware, labelRoutes);
router.use('/sections', authMiddleware, sectionRoutes);

export default router;
```

## Token Generation (for seeding)

```typescript
// scripts/create-user.ts
import { prisma } from '../src/db/client';
import { randomUUID } from 'crypto';

async function createUser(email: string, name: string) {
  const user = await prisma.user.create({
    data: {
      email,
      name,
      apiToken: randomUUID()
    }
  });
  console.log(`User created. API Token: ${user.apiToken}`);
}
```

## Acceptance Criteria

1. [ ] Requests without Authorization header return 401
2. [ ] Requests with invalid token return 401
3. [ ] Requests with valid token have `req.user` populated
4. [ ] Health check endpoint remains public
5. [ ] TypeScript types correctly extended
6. [ ] Token lookup is efficient (indexed)

## Verification

```bash
# Start server
npm run dev

# Test without auth (should fail)
curl http://localhost:3000/api/tasks

# Test with invalid token (should fail)
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/api/tasks

# Test with valid token (should succeed)
curl -H "Authorization: Bearer <valid-token>" http://localhost:3000/api/tasks
```

## Security Notes

- API tokens should be treated as secrets
- Consider token rotation mechanism in future
- Rate limiting should be added (separate task)
- Log failed auth attempts for security monitoring
