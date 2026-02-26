import { Router, Request, Response, NextFunction } from 'express';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  UpdateSectionSchema,
  UuidParamSchema
} from '@taskflow/shared';
import * as sectionService from '../services/sectionService.js';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /sections/:id - Get single section
router.get('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const section = await sectionService.getSection(req.params.id, req.user!.id);
    res.json(section);
  })
);

// PATCH /sections/:id - Update section
router.patch('/:id',
  validateParams(UuidParamSchema),
  validateBody(UpdateSectionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const section = await sectionService.updateSection(req.params.id, req.user!.id, req.body);
    res.json(section);
  })
);

// DELETE /sections/:id - Delete section
router.delete('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await sectionService.deleteSection(req.params.id, req.user!.id);
    res.status(204).send();
  })
);

export default router;
