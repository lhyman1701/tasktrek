# TASK-012: Build Quick-Add Endpoint

## Status: blocked

## Dependencies

- TASK-010: NLP Service

## Description

Create an endpoint that parses natural language AND creates the task in one step.

## Implementation

```typescript
// routes/ai.ts (add to existing)

const QuickAddSchema = z.object({
  text: z.string().min(1).max(500),
  projectId: z.string().uuid().optional(),
  createProject: z.boolean().optional().default(false),
  createLabels: z.boolean().optional().default(false)
});

router.post('/quick-add',
  validateBody(QuickAddSchema),
  async (req, res) => {
    const userId = req.user!.id;
    const { text, projectId, createProject, createLabels } = req.body;

    // Get context
    const [projects, labels] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        select: { id: true, name: true }
      }),
      prisma.label.findMany({
        where: { userId },
        select: { id: true, name: true }
      })
    ]);

    // Parse the text
    const parsed = await parseTaskText(text, {
      projects: projects.map(p => p.name),
      labels: labels.map(l => l.name)
    });

    // Resolve project
    let resolvedProjectId = projectId;
    if (parsed.project && !resolvedProjectId) {
      const existing = projects.find(
        p => p.name.toLowerCase() === parsed.project!.toLowerCase()
      );
      if (existing) {
        resolvedProjectId = existing.id;
      } else if (createProject) {
        const newProject = await prisma.project.create({
          data: { name: parsed.project, userId }
        });
        resolvedProjectId = newProject.id;
      }
    }

    // Resolve labels
    const labelIds: string[] = [];
    if (parsed.labels) {
      for (const labelName of parsed.labels) {
        const existing = labels.find(
          l => l.name.toLowerCase() === labelName.toLowerCase()
        );
        if (existing) {
          labelIds.push(existing.id);
        } else if (createLabels) {
          const newLabel = await prisma.label.create({
            data: { name: labelName, userId }
          });
          labelIds.push(newLabel.id);
        }
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        content: parsed.content,
        userId,
        projectId: resolvedProjectId,
        priority: priorityToInt(parsed.priority),
        dueDate: combineDateAndTime(parsed.dueDate, parsed.dueTime),
        labels: labelIds.length ? {
          connect: labelIds.map(id => ({ id }))
        } : undefined
      },
      include: { labels: true, project: true }
    });

    res.status(201).json({
      task,
      parsed,
      created: {
        project: resolvedProjectId && !projectId,
        labels: labelIds.length > 0 && createLabels
      }
    });
  }
);
```

## API Specification

### POST /api/ai/quick-add

**Request:**
```json
{
  "text": "Buy groceries tomorrow #shopping",
  "createLabels": true
}
```

**Response:**
```json
{
  "task": {
    "id": "uuid",
    "content": "Buy groceries",
    "dueDate": "2026-02-26T00:00:00Z",
    "labels": [{ "id": "uuid", "name": "shopping" }]
  },
  "parsed": {
    "content": "Buy groceries",
    "dueDate": "2026-02-26",
    "labels": ["shopping"]
  },
  "created": {
    "project": false,
    "labels": true
  }
}
```

## Acceptance Criteria

1. [ ] Parses and creates task in one request
2. [ ] Optionally creates missing projects
3. [ ] Optionally creates missing labels
4. [ ] Returns both task and parsed data
5. [ ] Indicates what was auto-created
