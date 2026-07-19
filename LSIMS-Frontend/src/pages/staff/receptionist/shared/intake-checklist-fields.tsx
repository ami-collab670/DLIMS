type Props = {
  clientIdVerified: boolean;
  onClientIdVerifiedChange: (checked: boolean) => void;
  packagingOk: boolean;
  onPackagingOkChange: (checked: boolean) => void;
};

/** Local UI checklist before intake submit — not persisted to the backend. */
export function IntakeChecklistFields({
  clientIdVerified,
  onClientIdVerifiedChange,
  packagingOk,
  onPackagingOkChange,
}: Props) {
  return (
    <fieldset className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">
        Intake checklist (optional)
      </legend>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
          checked={clientIdVerified}
          onChange={(e) => onClientIdVerifiedChange(e.target.checked)}
        />
        Client ID verified
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
          checked={packagingOk}
          onChange={(e) => onPackagingOkChange(e.target.checked)}
        />
        Packaging condition OK
      </label>
    </fieldset>
  );
}
