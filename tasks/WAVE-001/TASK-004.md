# TASK-004: Build Express App Foundation

## Status: blocked

## Dependencies

- TASK-001: Initialize Monorepo

## Description

Create the Express application with proper structure, middleware, error handling, and health check endpoint.

## Files to Create/Modify

```
packages/api/
├── package.json           # Add express, cors, helmet, etc.
├── src/
│   ├── index.ts          # Entry point
│   ├── app.ts            # Express app setup
│   ├── config/
│   │   └── env.ts        # Environment config
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   └── notFound.ts
│   └── routes/
│       ├── index.ts      # Route aggregator
│       └── health.ts     # Health check
└── .env.example
```

## Implementation Details

### Express App (app.ts)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { notFound } from './middleware/notFound';
import routes from './routes';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }));

  // Body parsing
  app.use(express.json({ limit: '10kb' }));

  // Request logging
  app.use(requestLogger);

  // Routes
  app.use('/api', routes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
```

### Error Handler

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Internal Server Error'
  });
}
```

### Health Check Route

```typescript
import { Router } from 'express';
import { prisma } from '../db/client';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

export default router;
```

## Package Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0"
  }
}
```

## Acceptance Criteria

1. [ ] Express app starts on configured port
2. [ ] Health check endpoint returns status
3. [ ] CORS configured correctly
4. [ ] Helmet security headers applied
5. [ ] Error handler catches all errors
6. [ ] Request logging works
7. [ ] 404 handler for unknown routes

## Verification

```bash
cd packages/api
npm run dev

# Test health check
curl http://localhost:3000/api/health

# Test 404 handling
curl http://localhost:3000/api/nonexistent
```

## Notes

- Use `express-async-handler` or similar for async route handling
- Limit JSON body size to prevent DoS
- Log request duration for monitoring
