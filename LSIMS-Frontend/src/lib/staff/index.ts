export * from "./permissions";

export {

  STAFF_ROUTE_KEYS,

  canAccessStaffRoute,

  canAccessUserManagement,

  canManageOperationalQueues,

  getStaffNavRouteKeys,

  type StaffRouteKey,

} from "./route-access";

export { STAFF_ROUTE_LABELS } from "./nav/labels";

export { getStaffNavItemLabel } from "./nav/item-label";

export {

  getStaffRoleStrip,

  getStaffWorkspaceTitle,

} from "./nav/workspace-title";

export { getAccessibleStaffAreaLabels } from "./nav/accessible-areas";

export {

  getStaffRouteBreadcrumbs,

  type RouteBreadcrumbSegment,

} from "./nav/breadcrumbs";

export { roleOptionLabel } from "./roles/role-display";
export { resolveRoleLabel } from "./roles/resolve-role-label";

export {

  RECEPTIONIST_MESSAGE_TEMPLATES,

  type ReceptionistMessageTemplate,

} from "./receptionist/message-templates";

export {

  CLIENT_SEARCH_MIN_LENGTH,

  hasClientSearchQuery,

  matchesClientSearch,

  type ClientSearchFields,

} from "./receptionist/client-search";

export {

  clientMatchesSearch,

  jobCountByClientEmail,

  jobsForClient,

} from "./receptionist/client-jobs";

export { dashboardKeys } from "./dashboard/query-keys";

export {
  buildAnalystDirectory,
  isUserUuid,
  resolveInitialAnalystUserId,
  type DepartmentAnalystOption,
} from "./qc-manager/analyst-directory";

export {
  buildLabTechDirectory,
  type DepartmentLabTechOption,
} from "./qc-manager/lab-tech-directory";

export {
  QC_DESK_PAGE_SIZE,
  QC_PREVIEW_LIMIT,
  QC_RECENT_DECISIONS_LIMIT,
} from "./qc/constants";

export {
  ANALYST_DESK_PREVIEW_LIMIT,
  ANALYST_LIST_PAGE_SIZE,
  ANALYST_SAMPLE_STATUS_OPTIONS,
} from "./analyst/constants";

export { LAB_TECH_DESK_PREVIEW_LIMIT } from "./prep/constants";

export {
  LABORATORY_PAGE_SIZE,
  type LaboratoryTabId,
} from "./laboratory/constants";

export { LIMS_EXTENSION_PAGE_SIZE } from "./lims-extensions/constants";

export { SAMPLE_STATUS_OPTIONS } from "./samples/constants";

export {
  staffFinanceTabUrl,
  staffPath,
  staffSegmentPath,
} from "./routing";

