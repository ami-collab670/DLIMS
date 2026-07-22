/** Canonical application paths — mirror [`routes/config.tsx`](../../routes/config.tsx). */
export const ROUTES = {
  home: "/",
  about: "/about",
  services: "/services",
  contact: "/contact",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  staff: {
    root: "/staff",
    laboratory: "/staff/laboratory",
    clients: "/staff/clients",
    results: "/staff/results",
    qc: {
      root: "/staff/qc",
      history: "/staff/qc/history",
      rejected: "/staff/qc/rejected",
    },
    reports: "/staff/reports",
    finance: "/staff/finance",
    inventory: "/staff/inventory",
    instruments: "/staff/instruments",
    compliance: "/staff/compliance",
    scheduling: "/staff/scheduling",
    notifications: "/staff/notifications",
    users: "/staff/users",
    samples: "/staff/samples",
    analyst: "/staff/analyst",
    prep: "/staff/prep",
    profile: "/staff/profile",
    settings: "/staff/settings",
  },
  client: {
    root: "/client",
    requests: "/client/requests",
    complaints: "/client/complaints",
    results: "/client/results",
    notifications: "/client/notifications",
    profile: "/client/profile",
  },
} as const;

export type StaffFinanceTab =
  | "reports"
  | "compliance"
  | "discounts"
  | "invoices";

export type ClientPathKey = keyof typeof ROUTES.client;

export type StaffPathKey = Exclude<
  keyof typeof ROUTES.staff,
  "qc" | "root"
>;
