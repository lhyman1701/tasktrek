# TASK-011: Build AI Parse Endpoint

## Status: blocked

## Dependencies

- TASK-010: NLP Service

## Description

Create an API endpoint that accepts natural language text and returns parsed task structure.

## Files to Create/Modify

```
packages/api/src/
└── routes/
    └── ai.ts
```

## Implementation

```typescript
// routes/ai.ts
import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { parseTaskText } from '../services/nlpService';
import { prisma } from '../db/client';

const router = Router();

const ParseRequestSchema = z.object({
  text: z.string().min(1).max(500)
});

router.post('/parse',
  validateBody(ParseRequestSchema),
  async (req, res) => {
    const userId = req.user!.id;

    // Get user's projects and labels for context
    const [projects, labels] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        select: { name: true }
      }),
      prisma.label.findMany({
        where: { userId },
        select: { name: true }
      })
    ]);

    const parsed = await parseTaskText(req.body.text, {
      projects: projects.map(p => p.name),
      labels: labels.map(l => l.name)
    });

    res.json(parsed);
  }
);

export default router;
```

## API Specification

### POST /api/ai/parse

**Request:**
```json
{
  "text": "Buy groceries tomorrow at 5pm #shopping"
}
```

**Response:**
```json
{
  "content": "Buy groceries",
  "dueDate": "2026-02-26",
  "dueTime": "17:00",
  "labels": ["shopping"]
}
```

## Acceptance Criteria

1. [ ] Endpoint accepts text input
2. [ ] Returns parsed task structure
3. [ ] Includes user's projects/labels in context
4. [ ] Handles errors gracefully
5. [ ] Rate limited to prevent abuse

## Verification

```bash
curl -X POST http://localhost:3000/api/ai/parse \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk tomorrow at 3pm"}'
```
