import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api-error";

export function toastApiError(error: unknown): void {
  toast.error(
    getApiErrorMessage(error) || "Something went wrong. Please try again.",
  );
}
