export type JobOrderSortKey =
  | "id"
  | "current_status"
  | "priority"
  | "sample_count"
  | "created_at"
  | "description"
  | "client__email";

export type JobOrderSortDirection = "asc" | "desc";

export type JobOrderSortState = {
  key: JobOrderSortKey;
  direction: JobOrderSortDirection;
};

export const DEFAULT_JOB_ORDER_SORT: JobOrderSortState = {
  key: "created_at",
  direction: "desc",
};

export function toOrderingParam(state: JobOrderSortState): string {
  return state.direction === "desc" ? `-${state.key}` : state.key;
}

export function toggleSortState(
  prev: JobOrderSortState,
  key: JobOrderSortKey,
): JobOrderSortState {
  if (prev.key === key) {
    return {
      key,
      direction: prev.direction === "asc" ? "desc" : "asc",
    };
  }
  return { key, direction: "desc" };
}
