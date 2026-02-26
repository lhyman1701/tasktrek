import { z } from 'zod';

// Task Priority
export const TaskPrioritySchema = z.enum(['p1', 'p2', 'p3', 'p4']);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

// Create Task
export const CreateTaskSchema = z.object({
  content: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid().optional().nullable(),
  sectionId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  labels: z.array(z.string().uuid()).optional(),
  priority: TaskPrioritySchema.optional().default('p4'),
  dueDate: z.string().datetime().optional().nullable(),
  dueString: z.string().optional() // For NLP parsing
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

// Update Task
export const UpdateTaskSchema = CreateTaskSchema.partial();
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

// Full Task (from database)
export const TaskSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  description: z.string().nullable(),
  projectId: z.string().uuid().nullable(),
  sectionId: z.string().uuid().nullable(),
  parentId: z.string().uuid().nullable(),
  priority: z.number().int().min(1).max(4),
  isCompleted: z.boolean(),
  order: z.number().int(),
  dueDate: z.string().datetime().nullable(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Task = z.infer<typeof TaskSchema>;

// Task with relations
export const TaskWithRelationsSchema = TaskSchema.extend({
  labels: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string()
  })).optional(),
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string()
  }).nullable().optional()
});
export type TaskWithRelations = z.infer<typeof TaskWithRelationsSchema>;

// Helper for parsing boolean query params
const booleanQueryParam = z.preprocess(
  (val) => {
    if (val === 'true' || val === '1') return true;
    if (val === 'false' || val === '0') return false;
    return val;
  },
  z.boolean().optional()
);

// Task query filters
export const TaskQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  completed: booleanQueryParam,
  priority: TaskPrioritySchema.optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});
export type TaskQuery = z.infer<typeof TaskQuerySchema>;
