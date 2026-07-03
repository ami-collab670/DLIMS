import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRole,
  deleteRole,
  fetchRoles,
  patchRole,
  type RoleName,
} from "@/features/accounts/roles-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { RoleRecord } from "@/types/account-admin";

import { roleOptionLabel } from "./role-display";

const ROLE_NAME_OPTIONS: { value: RoleName; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "receptionist", label: "Receptionist" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "analyst", label: "Lab Analyst" },
  { value: "qc_manager", label: "QC Manager" },
  { value: "lab_director", label: "Lab Director" },
  { value: "finance", label: "Finance Officer" },
  { value: "procurement", label: "Procurement Officer" },
  { value: "ministry_coordinator", label: "Ministry Coordinator" },
  { value: "auditor", label: "Auditor" },
];

export function RolesManagementSection() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [form, setForm] = useState<{ role_name: RoleName; contact_alias: string }>({
    role_name: "analyst",
    contact_alias: "",
  });

  const { data: roles = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createRole({
        role_name: form.role_name,
        contact_alias: form.contact_alias.trim(),
      }),
    onSuccess: () => {
      toast.success("Role created.");
      setShowCreate(false);
      setForm({ role_name: "analyst", contact_alias: "" });
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const patchMut = useMutation({
    mutationFn: () =>
      patchRole(editing!.id, {
        role_name: form.role_name,
        contact_alias: form.contact_alias.trim(),
      }),
    onSuccess: () => {
      toast.success("Role updated.");
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast.success("Role deleted.");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  function openEdit(role: RoleRecord) {
    setEditing(role);
    setForm({
      role_name: role.role_name as RoleName,
      contact_alias: role.contact_alias,
    });
    setShowCreate(false);
  }

  function resetForm() {
    setEditing(null);
    setShowCreate(false);
    setForm({ role_name: "analyst", contact_alias: "" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Manage system roles.{" "}
          <code className="rounded bg-muted px-1">display_name</code> appears only
          on nested user payloads, not on this list endpoint.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
        >
          Add role
        </Button>
      </div>

      {(showCreate || editing) ? (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.contact_alias.trim()) {
              toast.error("Contact alias is required.");
              return;
            }
            if (editing) patchMut.mutate();
            else createMut.mutate();
          }}
        >
          <p className="md:col-span-2 text-sm font-medium">
            {editing ? "Edit role" : "New role"}
          </p>
          <div className="space-y-1">
            <Label>Role key</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.role_name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role_name: e.target.value as RoleName,
                }))
              }
            >
              {ROLE_NAME_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Contact alias</Label>
            <Input
              value={form.contact_alias}
              onChange={(e) =>
                setForm((f) => ({ ...f, contact_alias: e.target.value }))
              }
              placeholder="e.g. Lab Analyst Desk"
            />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button
              type="submit"
              disabled={createMut.isPending || patchMut.isPending}
            >
              {editing ? "Save changes" : "Create role"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-destructive">{getApiErrorMessage(error)}</p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2 font-medium">Role key</th>
                <th className="px-4 py-2 font-medium">Display label</th>
                <th className="px-4 py-2 font-medium">Contact alias</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">{r.role_name}</td>
                  <td className="px-4 py-2">{roleOptionLabel(r)}</td>
                  <td className="px-4 py-2">{r.contact_alias || "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive"
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (
                            confirm(
                              `Delete role "${roleOptionLabel(r)}"? Users assigned to it may break.`,
                            )
                          ) {
                            deleteMut.mutate(r.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && roles.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No roles found.</p>
        ) : null}
      </div>
    </div>
  );
}
