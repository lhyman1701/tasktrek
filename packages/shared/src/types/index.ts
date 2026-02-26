// Re-export all types from schemas
// Types are inferred from Zod schemas using z.infer<>

export type {
  // Common
  Uuid,
  UuidParam,
  PaginationQuery,
  Timestamps,
  // Task
  TaskPriority,
  CreateTask,
  UpdateTask,
  Task,
  TaskWithRelations,
  TaskQuery,
  // Project
  ProjectColor,
  CreateProject,
  UpdateProject,
  Project,
  ProjectWithSections,
  // Label
  CreateLabel,
  UpdateLabel,
  Label,
  // Section
  CreateSection,
  UpdateSection,
  Section,
  SectionWithTasks,
  // User
  User,
  RequestUser
} from '../schemas/index.js';
