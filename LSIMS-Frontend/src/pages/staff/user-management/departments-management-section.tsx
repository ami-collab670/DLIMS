import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  patchDepartment,
} from "@/features/accounts/departments-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { DepartmentRecord } from "@/types/account-admin";

export function DepartmentsManagementSection() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: () => fetchDepartments(),
  });

  const departments = data?.results ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createDepartment({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Department created.");
      resetForm();
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const patchMut = useMutation({
    mutationFn: () =>
      patchDepartment(editing!.id, {
        name: form.name.trim(),
        description: form.description.trim(),
      }),
    onSuccess: () => {
      toast.success("Department updated.");
      resetForm();
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      toast.success("Department deleted.");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  function resetForm() {
    setEditing(null);
    setShowCreate(false);
    setForm({ name: "", description: "" });
  }

  function openEdit(dept: DepartmentRecord) {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description ?? "" });
    setShowCreate(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Organize internal staff by department. Assign departments when creating or editing users.
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
          Add department
        </Button>
      </div>

      {showCreate || editing ? (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("Department name is required.");
              return;
            }
            if (editing) patchMut.mutate();
            else createMut.mutate();
          }}
        >
          <p className="md:col-span-2 text-sm font-medium">
            {editing ? "Edit department" : "New department"}
          </p>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Analytical Chemistry"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button
              type="submit"
              disabled={createMut.isPending || patchMut.isPending}
            >
              {editing ? "Save changes" : "Create department"}
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
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="px-4 py-2 font-medium">{d.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {d.description?.trim() || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openEdit(d)}
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
                              `Delete department "${d.name}"? Users may lose their department link.`,
                            )
                          ) {
                            deleteMut.mutate(d.id);
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
        {!isLoading && departments.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No departments yet.</p>
        ) : null}
      </div>
    </div>
  );
}
