import {
  ClientPlaceholderContent,
  type ClientPlaceholderPageProps,
} from "./client-placeholder-content";

export type { ClientPlaceholderPageProps } from "./client-placeholder-content";

export function ClientPlaceholderPage(props: ClientPlaceholderPageProps) {
  return (
    <div className="space-y-2">
      <ClientPlaceholderContent {...props} />
    </div>
  );
}
