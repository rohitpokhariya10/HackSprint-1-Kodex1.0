import api from "../api/axios";
import { cleanParams } from "./api/helpers";

export const projectService = {
  getProjects: (params?: Record<string, unknown>) =>
    api.get("/projects", { params: cleanParams(params) }),
  getProjectById: (id: string) => api.get(`/projects/${id}`),
  createProject: (payload: FormData | Record<string, unknown>) =>
    api.post("/projects", payload),
  updateProject: (id: string, payload: FormData | Record<string, unknown>) =>
    api.patch(`/projects/${id}`, payload),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
};
