import api from "../api/axios";
import { cleanParams } from "./api/helpers";

export const profileService = {
  getProfiles: (params?: Record<string, unknown>) =>
    api.get("/profiles", { params: cleanParams(params) }),
  getMyProfile: () => api.get("/profiles/me"),
  getProfileByUserId: (userId: string) => api.get(`/profiles/${userId}`),
  createProfile: (payload: FormData | Record<string, unknown>) =>
    api.post("/profiles", payload),
  updateMyProfile: (payload: FormData | Record<string, unknown>) =>
    api.patch("/profiles/me", payload),
};
