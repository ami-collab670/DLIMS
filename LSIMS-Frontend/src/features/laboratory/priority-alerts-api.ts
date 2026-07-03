import { apiClient } from "@/api/client";
import type { PriorityAlert } from "@/types/laboratory";

const BASE = "/api/laboratory/priority-alerts/";

export async function fetchPriorityAlerts(): Promise<PriorityAlert[]> {
  const { data } = await apiClient.get<PriorityAlert[]>(BASE);
  return data;
}
