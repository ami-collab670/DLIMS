import { Outlet, useLocation } from "react-router-dom";

import { ThemeProviders } from "@/components/ThemeProviders";
import { Header } from "@/components/layout/root/Header";

export function RootLayout() {
  const { pathname } = useLocation();
  const hidePublicHeader =
    pathname.startsWith("/staff") || pathname.startsWith("/client");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ThemeProviders>
        {!hidePublicHeader ? <Header /> : null}
        <Outlet />
      </ThemeProviders>
    </div>
  );
}
