import { ErrorPageShell } from "@/pages/errors/error-page-shell";
import { NotFoundContent } from "@/pages/errors/not-found-content";

export default function StaffNotFoundPage() {
  return (
    <ErrorPageShell embedded>
      <NotFoundContent variant="staff" />
    </ErrorPageShell>
  );
}
