import { shortId } from "@/lib/short-id";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

type Props = {
  profile: AuthUser;
  /** Staff profile: show username, user id, role key, contact alias, status. */
  extended?: boolean;
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          : "bg-destructive/15 text-destructive",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function ProfileAccountSection({ profile, extended = false }: Props) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="account-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="account-heading" className="text-sm font-medium">
          Account
        </h3>
        {extended && profile.is_superuser ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Superuser
          </span>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{profile.email}</dd>
        </div>
        {extended ? (
          <div>
            <dt className="text-muted-foreground">Username</dt>
            <dd className="font-medium">{profile.username || "—"}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground">Account type</dt>
          <dd className="capitalize">{profile.user_type}</dd>
        </div>
        {extended ? (
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="font-mono text-xs" title={profile.id}>
              {shortId(profile.id)}
            </dd>
          </div>
        ) : null}
        {extended && profile.role_detail ? (
          <>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd>{profile.role_detail.display_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role key</dt>
              <dd className="font-mono text-xs">{profile.role_detail.role_name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Role contact alias</dt>
              <dd>{profile.role_detail.contact_alias?.trim() || "—"}</dd>
            </div>
          </>
        ) : !extended && profile.role_detail ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{profile.role_detail.display_name}</dd>
          </div>
        ) : null}
        {extended ? (
          <div>
            <dt className="text-muted-foreground">Account status</dt>
            <dd>
              <StatusBadge active={profile.is_active} />
            </dd>
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
