import {
  toggleSortState as toggleTableSortState,
  toOrderingParam as tableToOrderingParam,
  type SortState,
} from "@/lib/table";

export type JobOrderSortKey =
  | "id"
  | "current_status"
  | "priority"
  | "sample_count"
  | "created_at"
  | "description"
  | "client__email";

export type JobOrderSortState = SortState<JobOrderSortKey>;

export const DEFAULT_JOB_ORDER_SORT: JobOrderSortState = {
  key: "created_at",
  direction: "desc",
};

export function toOrderingParam(state: JobOrderSortState): string {
  return tableToOrderingParam(state);
}

export function toggleSortState(
  prev: JobOrderSortState,
  key: JobOrderSortKey,
): JobOrderSortState {
  return toggleTableSortState(prev, key);
}
