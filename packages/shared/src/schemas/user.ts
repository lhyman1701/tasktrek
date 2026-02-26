import { z } from 'zod';

// User (public info)
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type User = z.infer<typeof UserSchema>;

// User for request context (attached to req.user)
export const RequestUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable()
});
export type RequestUser = z.infer<typeof RequestUserSchema>;
