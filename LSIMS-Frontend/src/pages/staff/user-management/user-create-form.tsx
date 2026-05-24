import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CreateAdminUserBody,
} from "@/features/accounts/admin-api";
import { fetchRoles } from "@/features/accounts/roles-api";
import { cn } from "@/lib/utils";

import { roleOptionLabel } from "./role-display";

type Props = {
  onSubmit: (body: CreateAdminUserBody) => void;
  isPending: boolean;
};

export function UserCreateForm({ onSubmit, isPending }: Props) {
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
  });

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    user_type: "external" as "internal" | "external",
    role: "" as string,
    organization_name: "",
    nationality: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email || !form.password || form.password.length < 8) {
      toast.error("Email and password (min 8 chars) are required.");
      return;
    }
    onSubmit({
      username: form.username.trim() || email,
      email,
      password: form.password,
      first_name: form.first_name.trim() || undefined,
      last_name: form.last_name.trim() || undefined,
      phone: form.phone.trim() || undefined,
      user_type: form.user_type,
      role: form.user_type === "internal" ? form.role || undefined : null,
      organization_name: form.organization_name.trim() || undefined,
      nationality: form.nationality.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <p className="text-sm font-medium">Create user</p>
        <p className="text-xs text-muted-foreground">
          Internal users must have a LSIMS role. External users are clients.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-email">Email</Label>
        <Input
          id="c-email"
          type="email"
          required
          autoComplete="off"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-user">Username (optional)</Label>
        <Input
          id="c-user"
          placeholder="Defaults to email"
          value={form.username}
          onChange={(e) =>
            setForm((f) => ({ ...f, username: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-pass">Password</Label>
        <Input
          id="c-pass"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) =>
            setForm((f) => ({ ...f, password: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-type">Account type</Label>
        <select
          id="c-type"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
          value={form.user_type}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              user_type: e.target.value as "internal" | "external",
            }))
          }
        >
          <option value="external">External (client)</option>
          <option value="internal">Internal (staff)</option>
        </select>
      </div>
      {form.user_type === "internal" ? (
        <div className="space-y-2 col-span-full">
          <Label htmlFor="c-role">Role</Label>
          <select
            id="c-role"
            required
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            disabled={rolesLoading}
          >
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {roleOptionLabel(r)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="c-fn">First name</Label>
        <Input
          id="c-fn"
          value={form.first_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, first_name: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-ln">Last name</Label>
        <Input
          id="c-ln"
          value={form.last_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, last_name: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-phone">Phone</Label>
        <Input
          id="c-phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-org">Organization (clients)</Label>
        <Input
          id="c-org"
          value={form.organization_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, organization_name: e.target.value }))
          }
        />
      </div>
      <div className="flex items-end gap-2 md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create user"
          )}
        </Button>
      </div>
    </form>
  );
}
