import api from "../api/axios";
import { cleanParams } from "./api/helpers";

export const blogService = {
  getBlogs: (params?: Record<string, unknown>) =>
    api.get("/blogs", { params: cleanParams(params) }),
  getMyBlogs: (params?: Record<string, unknown>) =>
    api.get("/blogs/my", { params: cleanParams(params) }),
  getBlogBySlug: (idOrSlug: string) => api.get(`/blogs/${idOrSlug}`),
  createBlog: (payload: FormData | Record<string, unknown>) => api.post("/blogs", payload),
  updateBlog: (id: string, payload: FormData | Record<string, unknown>) =>
    api.patch(`/blogs/${id}`, payload),
  deleteBlog: (id: string) => api.delete(`/blogs/${id}`),
};
