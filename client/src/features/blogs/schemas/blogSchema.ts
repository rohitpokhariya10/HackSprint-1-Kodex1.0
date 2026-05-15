import { z } from "zod";

export const blogSchema = z.object({
  title: z.string().min(5, "Title is required"),
  excerpt: z.string().optional(),
  content: z.string().min(30, "Content must be at least 30 characters"),
  tags: z.string().min(2, "Add at least one tag"),
  category: z.string().min(2, "Category is required"),
  status: z.enum(["published", "draft"]),
});

export type BlogValues = z.infer<typeof blogSchema>;
