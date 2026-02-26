import { Router, Request, Response, NextFunction } from 'express';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  CreateLabelSchema,
  UpdateLabelSchema,
  UuidParamSchema
} from '@taskflow/shared';
import * as labelService from '../services/labelService.js';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /labels - List labels
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const labels = await labelService.listLabels(req.user!.id);
    res.json(labels);
  })
);

// GET /labels/:id - Get single label
router.get('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const label = await labelService.getLabel(req.params.id, req.user!.id);
    res.json(label);
  })
);

// POST /labels - Create label
router.post('/',
  validateBody(CreateLabelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const label = await labelService.createLabel(req.user!.id, req.body);
    res.status(201).json(label);
  })
);

// PATCH /labels/:id - Update label
router.patch('/:id',
  validateParams(UuidParamSchema),
  validateBody(UpdateLabelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const label = await labelService.updateLabel(req.params.id, req.user!.id, req.body);
    res.json(label);
  })
);

// DELETE /labels/:id - Delete label
router.delete('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await labelService.deleteLabel(req.params.id, req.user!.id);
    res.status(204).send();
  })
);

export default router;
