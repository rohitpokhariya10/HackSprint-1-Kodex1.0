import type { AxiosResponse } from "axios";

export const extractData = <T>(res: AxiosResponse<{ data?: T } | T>) => {
  const body = res.data as { data?: T } | T;
  return "data" in Object(body) && (body as { data?: T }).data !== undefined
    ? (body as { data: T }).data
    : (body as T);
};

export const extractMeta = (res: AxiosResponse<{ meta?: unknown }>) =>
  res.data?.meta ?? null;

export const cleanParams = (params?: Record<string, unknown>) => {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined
    )
  );
};
