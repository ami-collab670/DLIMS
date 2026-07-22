export const accountKeys = {
  all: ["accounts"] as const,
  adminUsers: {
    all: ["accounts", "admin-users"] as const,
    list: (params: Record<string, unknown>) =>
      ["accounts", "admin-users", "list", params] as const,
    detail: (id: string) => ["accounts", "admin-users", "detail", id] as const,
    externalClients: (params?: Record<string, unknown>) =>
      ["accounts", "admin-users", "external-clients", params] as const,
    analystUsers: (params?: Record<string, unknown>) =>
      ["accounts", "admin-users", "analyst-users", params] as const,
  },
  departments: {
    all: ["accounts", "departments"] as const,
    list: (params?: Record<string, unknown>) =>
      ["accounts", "departments", "list", params] as const,
    detail: (id: string) => ["accounts", "departments", "detail", id] as const,
  },
  roles: {
    all: ["accounts", "roles"] as const,
    list: (params?: Record<string, unknown>) =>
      ["accounts", "roles", "list", params] as const,
    detail: (id: string) => ["accounts", "roles", "detail", id] as const,
  },
  labAnalysts: () => ["accounts", "lab-analysts"] as const,
  labClients: () => ["accounts", "lab-clients"] as const,
};
