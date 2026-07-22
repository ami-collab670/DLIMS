import { JOB_STATUS_OPTIONS } from "@/lib/laboratory";

export const ANALYST_DESK_PREVIEW_LIMIT = 5;
export const ANALYST_LIST_PAGE_SIZE = 20;

/** Same pipeline as job orders: submitted → received → … → completed */
export const ANALYST_SAMPLE_STATUS_OPTIONS = JOB_STATUS_OPTIONS;
