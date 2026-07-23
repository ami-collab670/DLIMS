import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { env } from "@/config/env";
import { setCmsPreviewMode, type CmsPreviewPublicationStatus } from "@/features/cms/preview";
import { ROUTES } from "@/lib/routing";

function isSafePreviewPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function parsePreviewStatus(value: string | null): CmsPreviewPublicationStatus {
  return value === "draft" ? "draft" : "published";
}

export function CmsPreviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const secret = searchParams.get("secret");
    const url = searchParams.get("url");
    const status = parsePreviewStatus(searchParams.get("status"));

    if (!env.previewSecret || secret !== env.previewSecret) {
      setError("Invalid preview token.");
      return;
    }

    if (!url || !isSafePreviewPath(url)) {
      setError("Invalid preview path.");
      return;
    }

    setCmsPreviewMode(status);
    navigate(url, { replace: true });
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => navigate(ROUTES.home, { replace: true })}
        >
          Go to homepage
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading preview…</p>
    </div>
  );
}
