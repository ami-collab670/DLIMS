type Props = {
  title: string;
  description: string;
};

export function ProfilePageHeader({ title, description }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
