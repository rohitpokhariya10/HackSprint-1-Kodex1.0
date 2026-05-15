import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(3, "Title is required"),
  shortDescription: z.string().optional(),
  description: z.string().min(10, "Description is required"),
  techStack: z.string().min(2, "Add tech stack"),
  githubLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  liveLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  category: z.string().min(2, "Category is required"),
  status: z.enum(["published", "draft"]),
});

export type ProjectValues = z.infer<typeof projectSchema>;
