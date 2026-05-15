import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearAuth, setUser } from "../../features/auth/authSlice";
import type { ApiResponse, Blog, Profile, Project, User } from "../../shared/types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

type QueryParams = Record<string, string | number | boolean | undefined | null>;
type SessionResponse = ApiResponse<User> & { authenticated?: boolean };

const cleanParams = (params?: QueryParams) => {
  if (!params) return undefined;

  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );

  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === "true") {
    console.log("SEARCH PARAMS:", cleanedParams);
  }

  return cleanedParams;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
});

const getRequestUrl = (args: string | { url?: string }) => {
  return typeof args === "string" ? args : args.url || "";
};

const isAuthBypassEndpoint = (url: string) => {
  return (
    url.includes("/auth/logout") ||
    url.includes("/auth/refresh-token") ||
    url.includes("/auth/session") ||
    url.includes("/auth/login") ||
    url.includes("/auth/register")
  );
};

let refreshPromise: Promise<ReturnType<typeof rawBaseQuery>> | null = null;
let refreshFailed = false;

export const baseApi = createApi({
  reducerPath: "devhubApi",
  baseQuery: async (args, api, extraOptions) => {
    const requestUrl = getRequestUrl(args);
    let result = await rawBaseQuery(args, api, extraOptions);

    if (!result.error && (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register"))) {
      refreshFailed = false;
    }

    if (
      result.error?.status === 401 &&
      !refreshFailed &&
      !isAuthBypassEndpoint(requestUrl)
    ) {
      if (!refreshPromise) {
        refreshPromise = Promise.resolve(rawBaseQuery(
          { url: "/auth/refresh-token", method: "POST" },
          api,
          extraOptions
        ));
      }

      const refreshResult = await refreshPromise;
      refreshPromise = null;

      if (refreshResult.data) {
        refreshFailed = false;
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        refreshFailed = true;
        api.dispatch(clearAuth());
      }
    }

    return result;
  },
  tagTypes: ["Auth", "Profile", "Project", "Blog"],
  endpoints: (builder) => ({
    register: builder.mutation<ApiResponse<User>, { name: string; email: string; password: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    login: builder.mutation<ApiResponse<User>, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    me: builder.query<SessionResponse, void>({
      query: () => "/auth/session",
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.authenticated === false) {
            dispatch(clearAuth());
            return;
          }

          dispatch(setUser(data.data || data.user || null));
        } catch {
          dispatch(clearAuth());
        }
      },
    }),
    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    getProfiles: builder.query<ApiResponse<Profile[]>, QueryParams | void>({
      query: (params) => ({ url: "/profiles", params: cleanParams(params || undefined) }),
      providesTags: ["Profile"],
    }),
    getMyProfile: builder.query<ApiResponse<Profile>, void>({
      query: () => "/profiles/me",
      providesTags: ["Profile"],
    }),
    getProfileByUserId: builder.query<ApiResponse<Profile>, string>({
      query: (userId) => `/profiles/${userId}`,
      providesTags: ["Profile"],
    }),
    createProfile: builder.mutation<ApiResponse<Profile>, FormData | Record<string, unknown>>({
      query: (body) => ({ url: "/profiles", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<ApiResponse<Profile>, FormData | Record<string, unknown>>({
      query: (body) => ({ url: "/profiles/me", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
    getProjects: builder.query<ApiResponse<Project[]>, QueryParams | void>({
      query: (params) => ({ url: "/projects", params: cleanParams(params || undefined) }),
      providesTags: ["Project"],
    }),
    getProject: builder.query<ApiResponse<Project>, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ["Project"],
    }),
    getMyProjects: builder.query<ApiResponse<Project[]>, QueryParams | void>({
      query: (params) => ({ url: "/projects/my", params: cleanParams(params || undefined) }),
      providesTags: ["Project"],
    }),
    createProject: builder.mutation<ApiResponse<Project>, FormData | Record<string, unknown>>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: ["Project"],
    }),
    updateProject: builder.mutation<ApiResponse<Project>, { id: string; body: FormData | Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/projects/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Project"],
    }),
    deleteProject: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Project"],
    }),
    getBlogs: builder.query<ApiResponse<Blog[]>, QueryParams | void>({
      query: (params) => ({ url: "/blogs", params: cleanParams(params || undefined) }),
      providesTags: ["Blog"],
    }),
    getMyBlogs: builder.query<ApiResponse<Blog[]>, QueryParams | void>({
      query: (params) => ({ url: "/blogs/my", params: cleanParams(params || undefined) }),
      providesTags: ["Blog"],
    }),
    getBlog: builder.query<ApiResponse<Blog>, string>({
      query: (idOrSlug) => `/blogs/${idOrSlug}`,
      providesTags: ["Blog"],
    }),
    createBlog: builder.mutation<ApiResponse<Blog>, FormData | Record<string, unknown>>({
      query: (body) => ({ url: "/blogs", method: "POST", body }),
      invalidatesTags: ["Blog"],
    }),
    updateBlog: builder.mutation<ApiResponse<Blog>, { id: string; body: FormData | Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/blogs/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Blog"],
    }),
    deleteBlog: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/blogs/${id}`, method: "DELETE" }),
      invalidatesTags: ["Blog"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useMeQuery,
  useLogoutMutation,
  useGetProfilesQuery,
  useGetMyProfileQuery,
  useGetProfileByUserIdQuery,
  useCreateProfileMutation,
  useUpdateProfileMutation,
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetMyProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetBlogsQuery,
  useGetMyBlogsQuery,
  useGetBlogQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = baseApi;
