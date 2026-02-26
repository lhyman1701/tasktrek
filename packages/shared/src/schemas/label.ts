import { z } from 'zod';
import { ProjectColorSchema } from './project.js';

// Create Label
export const CreateLabelSchema = z.object({
  name: z.string().min(1).max(60),
  color: ProjectColorSchema.optional().default('charcoal')
});
export type CreateLabel = z.infer<typeof CreateLabelSchema>;

// Update Label
export const UpdateLabelSchema = CreateLabelSchema.partial();
export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;

// Full Label (from database)
export const LabelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  order: z.number().int(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Label = z.infer<typeof LabelSchema>;
