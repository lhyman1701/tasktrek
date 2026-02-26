import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateQuery, validateParams } from '../middleware/validate.js';
import {
  getSmartList,
  getSmartListCounts,
  getTasksByDate,
  SmartListType
} from '../services/smartListService.js';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Valid smart list types
const smartListTypes = ['inbox', 'today', 'upcoming', 'overdue', 'no_date', 'priority', 'completed', 'all'] as const;

// Schema for smart list type param
const SmartListTypeSchema = z.object({
  type: z.enum(smartListTypes)
});

// Schema for list query params
const SmartListQuerySchema = z.object({
  priority: z.coerce.number().int().min(1).max(4).optional(),
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

// Schema for date range query
const DateRangeQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
});

// GET /api/smart-lists/counts - Get counts for all smart lists
router.get('/counts',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const timezone = req.headers['x-timezone'] as string || 'UTC';
    const counts = await getSmartListCounts(userId, timezone);
    res.json(counts);
  })
);

// GET /api/smart-lists/by-date - Get tasks grouped by date
router.get('/by-date',
  validateQuery(DateRangeQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const tasksByDate = await getTasksByDate(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    // Convert Map to object for JSON response
    const result: Record<string, unknown[]> = {};
    tasksByDate.forEach((tasks, date) => {
      result[date] = tasks;
    });

    res.json(result);
  })
);

// GET /api/smart-lists/:type - Get tasks for a smart list
router.get('/:type',
  validateParams(SmartListTypeSchema),
  validateQuery(SmartListQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const timezone = req.headers['x-timezone'] as string || 'UTC';
    const type = req.params.type as SmartListType;
    const priority = req.query.priority ? Number(req.query.priority) : undefined;
    const projectId = req.query.projectId as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const result = await getSmartList(userId, {
      type,
      priority,
      projectId,
      limit,
      offset,
      timezone
    });

    res.json(result);
  })
);

export default router;
