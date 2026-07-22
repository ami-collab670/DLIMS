export const staffQueryKeys = {
  departmentAnalystDirectory: (departmentId: string | null) =>
    ["staff", "department-analyst-directory", departmentId ?? "none"] as const,
  departmentLabTechDirectory: (departmentId: string | null) =>
    ["staff", "department-lab-tech-directory", departmentId ?? "none"] as const,
  receptionistDashboardKpis: () => ["staff", "receptionist", "dashboard-kpis"] as const,
} as const;
