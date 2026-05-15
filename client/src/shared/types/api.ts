export interface PaginationMeta {
  totalProfiles?: number;
  totalProjects?: number;
  totalBlogs?: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
}

export interface Profile {
  _id: string;
  user: User | string;
  headline?: string;
  bio?: string;
  avatar?: string;
  avatarFileId?: string;
  banner?: string;
  bannerFileId?: string;
  skills?: string[];
  githubUsername?: string;
  location?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  portfolioShowcase?: { title: string; link: string }[];
  isOpenToWork?: boolean;
  profileVisibility?: "public" | "private";
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  _id: string;
  owner: User | string;
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  techStack: string[];
  githubLink?: string;
  liveLink?: string;
  coverImage?: string;
  coverImageFileId?: string;
  images?: string[];
  imageFileIds?: string[];
  category?: string;
  status?: "draft" | "published";
  views?: number;
  likesCount?: number;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Blog {
  _id: string;
  author: User | string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  contentFormat?: "markdown" | "plainText";
  coverImage?: string;
  coverImageFileId?: string;
  tags?: string[];
  category: string;
  status?: "draft" | "published";
  readTime?: number;
  views?: number;
  likesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  user?: User;
  meta?: PaginationMeta;
  count?: number;
  totalProfiles?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface Paginated<T> {
  data: T[];
  meta?: Record<string, unknown>;
}
