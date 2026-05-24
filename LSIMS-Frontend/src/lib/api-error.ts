import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }

  const data = error.response?.data as Record<string, unknown> | string | undefined;

  if (data && typeof data === "object") {
    const detail = data.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && typeof detail[0] === "string") {
      return detail[0];
    }

    for (const [_key, val] of Object.entries(data)) {
      if (Array.isArray(val) && typeof val[0] === "string") return val[0];
      if (typeof val === "string") return val;
    }
  }

  if (error.response?.status === 401) {
    return "Invalid email or password, or session expired.";
  }

  return error.message || "Request failed.";
}
