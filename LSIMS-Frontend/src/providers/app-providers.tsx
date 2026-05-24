import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AuthBootstrap } from "@/providers/auth-bootstrap";
import { createQueryClient } from "@/lib/query-client";

const queryClient = createQueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
