import { ErrorPageShell } from "@/pages/errors/error-page-shell";
import { NotFoundContent } from "@/pages/errors/not-found-content";

export default function ClientNotFoundPage() {
  return (
    <ErrorPageShell embedded>
      <NotFoundContent variant="client" />
    </ErrorPageShell>
  );
}
