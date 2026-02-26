import { z } from 'zod';

// Common schemas used across entities

export const UuidSchema = z.string().uuid();

export const UuidParamSchema = z.object({
  id: z.string().uuid()
});

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const TimestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Inferred types
export type Uuid = z.infer<typeof UuidSchema>;
export type UuidParam = z.infer<typeof UuidParamSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type Timestamps = z.infer<typeof TimestampsSchema>;
