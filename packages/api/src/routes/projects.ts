import { Router, Request, Response, NextFunction } from 'express';
import { validate, validateBody, validateParams } from '../middleware/validate.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateSectionSchema,
  UuidParamSchema
} from '@taskflow/shared';
import * as projectService from '../services/projectService.js';
import * as sectionService from '../services/sectionService.js';
import { z } from 'zod';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /projects - List projects
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectService.listProjects(req.user!.id);
    res.json(projects);
  })
);

// GET /projects/:id - Get single project with sections and tasks
router.get('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getProject(req.params.id, req.user!.id);
    res.json(project);
  })
);

// POST /projects - Create project
router.post('/',
  validateBody(CreateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.createProject(req.user!.id, req.body);
    res.status(201).json(project);
  })
);

// PATCH /projects/:id - Update project
router.patch('/:id',
  validateParams(UuidParamSchema),
  validateBody(UpdateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.updateProject(req.params.id, req.user!.id, req.body);
    res.json(project);
  })
);

// POST /projects/:id/archive - Archive project
router.post('/:id/archive',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.archiveProject(req.params.id, req.user!.id);
    res.json(project);
  })
);

// DELETE /projects/:id - Delete project
router.delete('/:id',
  validateParams(UuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await projectService.deleteProject(req.params.id, req.user!.id);
    res.status(204).send();
  })
);

// Param schema for project sections routes
const ProjectIdParamSchema = z.object({
  id: z.string().uuid()
});

// GET /projects/:id/sections - List sections for a project
router.get('/:id/sections',
  validateParams(ProjectIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sections = await sectionService.listSections(req.params.id, req.user!.id);
    res.json(sections);
  })
);

// POST /projects/:id/sections - Create section in project
router.post('/:id/sections',
  validate({
    params: ProjectIdParamSchema,
    body: CreateSectionSchema.omit({ projectId: true })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const section = await sectionService.createSection(req.user!.id, {
      ...req.body,
      projectId: req.params.id
    });
    res.status(201).json(section);
  })
);

export default router;
