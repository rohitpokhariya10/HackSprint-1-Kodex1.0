import { z } from "zod";

export const profileSchema = z.object({
  headline: z.string().min(2, "Headline is required"),
  bio: z.string().min(10, "Bio should tell people about you"),
  skills: z.string().min(2, "Add at least one skill"),
  githubUsername: z.string().optional(),
  location: z.string().optional(),
  portfolio: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  github: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  linkedin: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  twitter: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  isOpenToWork: z.boolean().optional(),
});

export type ProfileValues = z.infer<typeof profileSchema>;
