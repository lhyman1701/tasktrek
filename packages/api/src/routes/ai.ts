import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { parseTaskText, combineDateAndTime } from '../services/nlpService.js';
import { prisma } from '../db/client.js';
import { priorityToInt } from '../utils/priority.js';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Schema for parse endpoint
const ParseRequestSchema = z.object({
  text: z.string().min(1).max(500)
});

// Schema for quick-add endpoint
const QuickAddSchema = z.object({
  text: z.string().min(1).max(500),
  projectId: z.string().uuid().optional(),
  createProject: z.boolean().optional().default(false),
  createLabels: z.boolean().optional().default(false)
});

// POST /api/ai/parse - Parse natural language text without creating task
router.post('/parse',
  validateBody(ParseRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const anthropicApiKey = req.headers['x-anthropic-key'] as string | undefined;
    const timezone = req.headers['x-timezone'] as string || 'UTC';

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

    const parsed = await parseTaskText(
      req.body.text,
      {
        projects: projects.map((p: { name: string }) => p.name),
        labels: labels.map((l: { name: string }) => l.name)
      },
      anthropicApiKey,
      timezone
    );

    res.json(parsed);
  })
);

// POST /api/ai/quick-add - Parse natural language and create task
router.post('/quick-add',
  validateBody(QuickAddSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const anthropicApiKey = req.headers['x-anthropic-key'] as string | undefined;
    const timezone = req.headers['x-timezone'] as string || 'UTC';
    const { text, projectId, createProject, createLabels } = req.body;

    // Get user's projects and labels for context
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
    const parsed = await parseTaskText(
      text,
      {
        projects: projects.map((p: { id: string; name: string }) => p.name),
        labels: labels.map((l: { id: string; name: string }) => l.name)
      },
      anthropicApiKey,
      timezone
    );

    // Resolve project
    let resolvedProjectId = projectId;
    let projectCreated = false;
    if (parsed.project && !resolvedProjectId) {
      const existing = projects.find(
        (p: { id: string; name: string }) => p.name.toLowerCase() === parsed.project!.toLowerCase()
      );
      if (existing) {
        resolvedProjectId = existing.id;
      } else if (createProject) {
        const newProject = await prisma.project.create({
          data: { name: parsed.project, userId }
        });
        resolvedProjectId = newProject.id;
        projectCreated = true;
      }
    }

    // Resolve labels
    const labelIds: string[] = [];
    let labelsCreated = false;
    if (parsed.labels) {
      for (const labelName of parsed.labels) {
        const existing = labels.find(
          (l: { id: string; name: string }) => l.name.toLowerCase() === labelName.toLowerCase()
        );
        if (existing) {
          labelIds.push(existing.id);
        } else if (createLabels) {
          const newLabel = await prisma.label.create({
            data: { name: labelName, userId }
          });
          labelIds.push(newLabel.id);
          labelsCreated = true;
        }
      }
    }

    // Get max order for task
    const maxOrder = await prisma.task.aggregate({
      where: { userId, projectId: resolvedProjectId || null },
      _max: { order: true }
    });

    // Create the task
    const task = await prisma.task.create({
      data: {
        content: parsed.content,
        userId,
        projectId: resolvedProjectId,
        priority: priorityToInt(parsed.priority),
        dueDate: combineDateAndTime(parsed.dueDate, parsed.dueTime),
        order: (maxOrder._max.order ?? -1) + 1,
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
        project: projectCreated,
        labels: labelsCreated
      }
    });
  })
);

export default router;
