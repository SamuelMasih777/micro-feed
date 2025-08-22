import { z } from 'zod';

// Validation schema for creating a post
export const createPostSchema = z.object({
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(280, 'Post content cannot exceed 280 characters'),
});

// Validation schema for updating a post
export const updatePostSchema = z.object({
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(280, 'Post content cannot exceed 280 characters'),
});

// Validation schema for search parameters
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  cursor: z.string().optional(),
  filter: z.enum(['all', 'mine']).optional().default('all'),
});

// Validation schema for post ID
export const postIdSchema = z.object({
  id: z.string().uuid('Invalid post ID'),
});

// Type inference from schemas
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
export type PostIdInput = z.infer<typeof postIdSchema>;
