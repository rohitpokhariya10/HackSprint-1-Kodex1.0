type ApiErrorData = {
  message?: unknown;
};

type ApiError = {
  data?: ApiErrorData;
  error?: unknown;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  const message = apiError?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (typeof apiError?.error === "string" && apiError.error.trim()) {
    return apiError.error;
  }

  return fallback;
};
