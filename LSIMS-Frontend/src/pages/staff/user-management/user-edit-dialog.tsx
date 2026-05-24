import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type UpdateAdminUserBody,
  fetchAdminUser,
} from "@/features/accounts/admin-api";
import { fetchRoles } from "@/features/accounts/roles-api";
import { cn } from "@/lib/utils";
import type { AdminUserRow } from "@/types/account-admin";

import { roleOptionLabel } from "./role-display";

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

type Props = {
  user: AdminUserRow;
  onClose: () => void;
  onSave: (input: {
    patch: UpdateAdminUserBody;
    newPassword?: string;
  }) => Promise<unknown>;
  isPending: boolean;
};

export function UserEditDialog({ user, onClose, onSave, isPending }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
  });

  const { data: freshUser } = useQuery({
    queryKey: ["admin-user", user.id],
    queryFn: () => fetchAdminUser(user.id),
    initialData: user,
    staleTime: 0,
  });

  const activeUser = freshUser ?? user;

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [userType, setUserType] = useState<"internal" | "external">(
    user.user_type,
  );
  const [roleId, setRoleId] = useState(user.role ?? "");
  const [nationality, setNationality] = useState(user.nationality ?? "");
  const [organizationName, setOrganizationName] = useState(
    user.organization_name ?? "",
  );
  const [organizationType, setOrganizationType] = useState(
    user.organization_type ?? "",
  );
  const [isActive, setIsActive] = useState(user.is_active);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setUsername(activeUser.username);
    setEmail(activeUser.email);
    setFirstName(activeUser.first_name ?? "");
    setLastName(activeUser.last_name ?? "");
    setPhone(activeUser.phone ?? "");
    setUserType(activeUser.user_type);
    setRoleId(activeUser.role ?? "");
    setNationality(activeUser.nationality ?? "");
    setOrganizationName(activeUser.organization_name ?? "");
    setOrganizationType(activeUser.organization_type ?? "");
    setIsActive(activeUser.is_active);
    setNewPassword("");
    setConfirmPassword("");
  }, [activeUser]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) {
      toast.error("Email is required.");
      return;
    }
    if (userType === "internal" && !roleId) {
      toast.error("Internal staff must have a role.");
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Password confirmation does not match.");
        return;
      }
    }

    const patch: UpdateAdminUserBody = {
      username: username.trim() || emailTrim,
      email: emailTrim,
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      user_type: userType,
      role: userType === "internal" ? roleId : null,
      nationality: nationality.trim() || undefined,
      organization_name: organizationName.trim() || undefined,
      organization_type: organizationType.trim() || undefined,
      is_active: isActive,
    };

    await onSave({
      patch,
      newPassword: newPassword.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="e-email">Email</Label>
            <Input
              id="e-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="e-user">Username</Label>
            <Input
              id="e-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-fn">First name</Label>
            <Input
              id="e-fn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-ln">Last name</Label>
            <Input
              id="e-ln"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="e-phone">Phone</Label>
            <Input
              id="e-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-type">Account type</Label>
            <select
              id="e-type"
              className={selectClass}
              value={userType}
              onChange={(e) =>
                setUserType(e.target.value as "internal" | "external")
              }
            >
              <option value="external">External (client)</option>
              <option value="internal">Internal (staff)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-active">Account status</Label>
            <select
              id="e-active"
              className={selectClass}
              value={isActive ? "active" : "inactive"}
              onChange={(e) => setIsActive(e.target.value === "active")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive (cannot sign in)</option>
            </select>
          </div>
          {userType === "internal" ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="e-role">Role</Label>
              <select
                id="e-role"
                required
                className={selectClass}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="e-org">Organization</Label>
            <Input
              id="e-org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="e-org-type">Organization type</Label>
            <Input
              id="e-org-type"
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="e-nationality">Nationality</Label>
            <Input
              id="e-nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            />
          </div>

          <div className="space-y-2 border-t border-border pt-4 sm:col-span-2">
            <p className="text-sm font-medium">Reset password (optional)</p>
            <p className="text-xs text-muted-foreground">
              If set, applies{" "}
              <code className="rounded bg-muted px-1">POST …/change-password/</code> after
              saving profile fields.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-pass">New password</Label>
            <Input
              id="e-pass"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-pass2">Confirm new password</Label>
            <Input
              id="e-pass2"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
