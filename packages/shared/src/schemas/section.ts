import { z } from 'zod';

// Create Section
export const CreateSectionSchema = z.object({
  name: z.string().min(1).max(120),
  projectId: z.string().uuid()
});
export type CreateSection = z.infer<typeof CreateSectionSchema>;

// Update Section
export const UpdateSectionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  order: z.number().int().optional()
});
export type UpdateSection = z.infer<typeof UpdateSectionSchema>;

// Full Section (from database)
export const SectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  order: z.number().int(),
  projectId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Section = z.infer<typeof SectionSchema>;

// Section with tasks
export const SectionWithTasksSchema = SectionSchema.extend({
  tasks: z.array(z.object({
    id: z.string().uuid(),
    content: z.string(),
    isCompleted: z.boolean(),
    priority: z.number().int()
  })).optional()
});
export type SectionWithTasks = z.infer<typeof SectionWithTasksSchema>;
