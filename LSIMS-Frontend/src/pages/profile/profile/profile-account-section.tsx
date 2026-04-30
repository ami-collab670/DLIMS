import type { AuthUser } from "@/types/auth";

export function ProfileAccountSection({ profile }: { profile: AuthUser }) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="account-heading"
    >
      <h3 id="account-heading" className="text-sm font-medium">
        Account
      </h3>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{profile.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Account type</dt>
          <dd className="capitalize">{profile.user_type}</dd>
        </div>
        {profile.role_detail ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{profile.role_detail.display_name}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground">Member since</dt>
          <dd>
            {new Date(profile.date_joined).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
