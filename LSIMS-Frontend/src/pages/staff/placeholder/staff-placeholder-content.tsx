export type StaffPlaceholderPageProps = {
  title: string;
  description?: string;
};

export function StaffPlaceholderContent({
  title,
  description,
}: StaffPlaceholderPageProps) {
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        This section will connect to the LSIMS API when you build the feature.
      </div>
    </>
  );
}
