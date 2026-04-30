import {
  StaffPlaceholderContent,
  type StaffPlaceholderPageProps,
} from "./staff-placeholder-content";

export type { StaffPlaceholderPageProps } from "./staff-placeholder-content";

export function StaffPlaceholderPage(props: StaffPlaceholderPageProps) {
  return (
    <div className="space-y-2">
      <StaffPlaceholderContent {...props} />
    </div>
  );
}
