import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/stores/auth-store";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return children;
}
