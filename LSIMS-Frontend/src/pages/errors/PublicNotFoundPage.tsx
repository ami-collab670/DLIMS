import { ErrorPageShell } from "@/pages/errors/error-page-shell";
import { NotFoundContent } from "@/pages/errors/not-found-content";

export default function PublicNotFoundPage() {
  return (
    <ErrorPageShell>
      <NotFoundContent variant="public" />
    </ErrorPageShell>
  );
}
