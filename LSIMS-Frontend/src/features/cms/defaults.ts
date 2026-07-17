export const DEFAULT_SITE_SETTINGS = {
  siteName: "LSIMS",
  navLinks: [
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Contact", path: "/contact" },
  ],
} as const;

export const DEFAULT_HOME_PAGE = {
  heroTitle: "Laboratory Sample Information Management",
  heroSubtitle:
    "Sign in to access your dashboard. Staff use the workspace with a sidebar; clients get a simple site-style layout.",
  primaryCtaLabel: "Sign in",
  secondaryCtaLabel: "Create account",
} as const;
