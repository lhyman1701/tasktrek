import { z } from 'zod';

// Project Colors
export const ProjectColorSchema = z.enum([
  'berry_red', 'red', 'orange', 'yellow', 'olive_green',
  'lime_green', 'green', 'mint_green', 'teal', 'sky_blue',
  'light_blue', 'blue', 'grape', 'violet', 'lavender',
  'magenta', 'salmon', 'charcoal', 'grey', 'taupe'
]);
export type ProjectColor = z.infer<typeof ProjectColorSchema>;

// Create Project
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  color: ProjectColorSchema.optional().default('charcoal'),
  parentId: z.string().uuid().optional().nullable(),
  isFavorite: z.boolean().optional().default(false)
});
export type CreateProject = z.infer<typeof CreateProjectSchema>;

// Update Project
export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;

// Full Project (from database)
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  order: z.number().int(),
  isFavorite: z.boolean(),
  isArchived: z.boolean(),
  parentId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Project = z.infer<typeof ProjectSchema>;

// Project with sections
export const ProjectWithSectionsSchema = ProjectSchema.extend({
  sections: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    order: z.number().int()
  })).optional()
});
export type ProjectWithSections = z.infer<typeof ProjectWithSectionsSchema>;
