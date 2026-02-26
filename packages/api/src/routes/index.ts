import { Router } from 'express';
import healthRoutes from './health.js';
import taskRoutes from './tasks.js';
import projectRoutes from './projects.js';
import labelRoutes from './labels.js';
import sectionRoutes from './sections.js';
import aiRoutes from './ai.js';
import chatRoutes from './chat.js';
import smartListRoutes from './smartLists.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes
router.use(healthRoutes);

// Protected routes (require authentication)
router.use('/tasks', authMiddleware, taskRoutes);
router.use('/projects', authMiddleware, projectRoutes);
router.use('/labels', authMiddleware, labelRoutes);
router.use('/sections', authMiddleware, sectionRoutes);
router.use('/ai', authMiddleware, aiRoutes);
router.use('/chat', authMiddleware, chatRoutes);
router.use('/smart-lists', authMiddleware, smartListRoutes);

export default router;
